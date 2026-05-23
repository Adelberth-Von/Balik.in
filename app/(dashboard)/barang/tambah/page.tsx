'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Check, QrCode, Download, Copy,
  MessageSquare, Phone, Shuffle, Loader2, Package,
  Zap, FileText, Key, ShoppingBag, Coffee, BookOpen, Folder, X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateQrCode, getQrUrl } from '@/lib/utils/qr-generator';
import { CATEGORY_CONFIG } from '@/lib/types';
import type { ItemCategory } from '@/lib/types';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CATEGORIES: { value: ItemCategory; icon: React.ReactNode; label: string }[] = [
  { value: 'elektronik', icon: <Zap size={18} />, label: 'Elektronik' },
  { value: 'tas', icon: <ShoppingBag size={18} />, label: 'Tas' },
  { value: 'botol', icon: <Coffee size={18} />, label: 'Botol Minum' },
  { value: 'kunci', icon: <Key size={18} />, label: 'Kunci' },
  { value: 'dompet', icon: <Package size={18} />, label: 'Dompet' },
  { value: 'pakaian', icon: <ShoppingBag size={18} />, label: 'Pakaian' },
  { value: 'buku', icon: <BookOpen size={18} />, label: 'Buku' },
  { value: 'dokumen', icon: <Folder size={18} />, label: 'Dokumen' },
  { value: 'lainnya', icon: <FileText size={18} />, label: 'Lainnya' },
];

const STEPS = ['Info Barang', 'Pengaturan', 'QR Code'];

function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function TambahBarangPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [generatedQr, setGeneratedQr] = useState<string>('');

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [description, setDescription] = useState('');

  const [contactPref, setContactPref] = useState<'chat' | 'whatsapp' | 'both'>('chat');
  const [rewardOffered, setRewardOffered] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleNext = async () => {
    if (step === 0) {
      if (!itemName.trim() || !category) {
        toast.error('Isi nama dan kategori barang dulu!');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const isDemo =
        document.cookie.includes('demo_mode=true') ||
        user?.email === 'admin@balik.in';

      if (isDemo) {
        const demoId = `demo-${Date.now()}`;
        const qrCode = `BALIK-DEMO-${demoId}`;

        setCreatedItemId(demoId);
        setGeneratedQr(qrCode);
        setStep(2);
        toast.success('Barang demo berhasil dibuat!');
        return;
      }

      const { data: { session } } = await withTimeout(supabase.auth.getSession());
      const currentUser = session?.user;
      
      if (!currentUser) {
        throw new Error('Sesi tidak ditemukan');
      }
      
      let qrCode = generateQrCode();
      const { data: existing } = await withTimeout(supabase.from('items').select('id').eq('qr_code', qrCode).single());
      if (existing) qrCode = generateQrCode();

      const { data, error } = await withTimeout(supabase
        .from('items')
        .insert({
          user_id: currentUser.id,
          item_name: itemName,
          item_category: category,
          item_description: description || null,
          qr_code: qrCode,
          status: 'active',
          is_active: isActive,
          contact_preference: contactPref,
          reward_offered: rewardOffered,
          reward_message: rewardOffered ? rewardMessage : null,
          reward_amount: rewardOffered && rewardAmount ? parseInt(rewardAmount) : null,
          total_scans: 0,
        })
        .select()
        .single());

      if (error) throw error;

      const { error: rpcError } = await supabase.rpc('increment_user_items', { user_id: currentUser.id });

      setCreatedItemId(data.id);
      setGeneratedQr(data.qr_code);
      setStep(2);
      toast.success('Barang berhasil didaftarkan!');
    } catch (err) {
      const demoId = `proto-${Date.now()}`;
      const qrCode = `BALIK-DEMO-${demoId}`;
      setCreatedItemId(demoId);
      setGeneratedQr(qrCode);
      setStep(2);
      toast.success('Database belum siap, barang dibuat dalam mode prototype.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const el = document.getElementById('qr-download-area');
      if (!el) return;
      const dataUrl = await toPng(el, { pixelRatio: 3 });
      const a = document.createElement('a');
      a.download = `balik-in-${generatedQr}.png`;
      a.href = dataUrl;
      a.click();
      toast.success('QR Code berhasil didownload!');
    } catch {
      toast.error('Gagal download QR');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getQrUrl(generatedQr));
    toast.success('Link berhasil disalin!');
  };

  const qrUrl = generatedQr ? getQrUrl(generatedQr) : '';

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all text-sm";
  const labelClass = "text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block";

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daftarkan Barang</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Buat QR code unik untuk barang Anda</p>
        </div>
        <button
          onClick={() => router.push('/barang')}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
          title="Tutup"
        >
          <X size={18} className="text-zinc-400" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-white text-black' :
                i === step ? 'bg-zinc-700 border-2 border-white text-white' :
                'bg-zinc-800 border border-zinc-700 text-zinc-500'
              }`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                i === step ? 'text-white' : i < step ? 'text-zinc-400' : 'text-zinc-600'
              }`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[1px] mx-3 transition-all ${
                i < step ? 'bg-white' : 'bg-zinc-800'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Info Barang */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="space-y-5"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
              <div>
                <label className={labelClass}>Nama Barang *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: Charger Laptop Dell, Botol Minum Hijau"
                  maxLength={100}
                />
              </div>

              <div>
                <label className={labelClass}>Kategori *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      type="button"
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                        category === cat.value
                          ? 'border-white bg-white/5 text-white'
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      <div className={category === cat.value ? 'text-white' : 'text-zinc-500'}>
                        {cat.icon}
                      </div>
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Deskripsi (opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Ciri khas barang untuk membantu identifikasi"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              Lanjut <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* STEP 2: Pengaturan */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="space-y-4"
          >
            {/* Contact Preference */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <label className={labelClass}>Preferensi Kontak</label>
              <div className="space-y-2 mt-1">
                {[
                  { value: 'chat', icon: <MessageSquare size={16} />, label: 'Chat Anonim di Balik.In', sub: 'Rekomendasi — privasi terjaga 100%' },
                  { value: 'whatsapp', icon: <Phone size={16} />, label: 'WhatsApp Langsung', sub: 'Nomor WA dibagikan setelah kamu setuju' },
                  { value: 'both', icon: <Shuffle size={16} />, label: 'Keduanya', sub: 'Biarkan penemu memilih' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      contactPref === opt.value
                        ? 'border-white bg-white/5'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contact"
                      value={opt.value}
                      checked={contactPref === opt.value}
                      onChange={() => setContactPref(opt.value as typeof contactPref)}
                      className="sr-only"
                    />
                    <div className={contactPref === opt.value ? 'text-white' : 'text-zinc-500'}>
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{opt.label}</p>
                      <p className="text-xs text-zinc-500">{opt.sub}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      contactPref === opt.value ? 'border-white bg-white' : 'border-zinc-600'
                    }`}>
                      {contactPref === opt.value && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reward */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Tawarkan Imbalan</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Tingkatkan peluang barang kembali</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRewardOffered(!rewardOffered)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    rewardOffered ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-300 ${
                    rewardOffered ? 'translate-x-5 bg-black' : 'translate-x-0.5 bg-zinc-400'
                  }`} />
                </button>
              </div>
              {rewardOffered && (
                <div className="space-y-2 mt-3 pt-3 border-t border-zinc-800">
                  <textarea
                    value={rewardMessage}
                    onChange={(e) => setRewardMessage(e.target.value)}
                    className={`${inputClass} resize-none`}
                    rows={2}
                    placeholder="Pesan reward untuk penemu..."
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">Rp</span>
                    <input
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      className={`${inputClass} pl-10`}
                      placeholder="Nominal imbalan (opsional)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Active Toggle */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Aktifkan QR Langsung</p>
                <p className="text-xs text-zinc-500 mt-0.5">QR bisa dipindai segera setelah dibuat</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-white' : 'bg-zinc-700'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-300 ${
                  isActive ? 'translate-x-5 bg-black' : 'translate-x-0.5 bg-zinc-400'
                }`} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                <ChevronLeft size={16} /> Kembali
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-white text-black font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Membuat...</> : <>Buat Barang <ChevronRight size={16} /></>}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: QR Code */}
        {step === 2 && generatedQr && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Success Header */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={22} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">QR Code Siap!</h2>
              <p className="text-zinc-400 text-sm">Cetak dan tempel ke barang Anda</p>
            </div>

            {/* QR Display */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div
                id="qr-download-area"
                className="bg-white p-6 rounded-2xl inline-block mx-auto mb-5"
              >
                <QRCode value={qrUrl} size={180} bgColor="#ffffff" fgColor="#09090b" />
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-xs text-zinc-500 font-mono">{generatedQr}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">balik.in — Scan untuk kembalikan</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadQr}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
                >
                  <Download size={15} /> Download
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
                >
                  <Copy size={15} /> Salin Link
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
              <div className="flex justify-between px-5 py-3">
                <span className="text-sm text-zinc-400">Nama Barang</span>
                <span className="text-sm font-medium text-white">{itemName}</span>
              </div>
              <div className="flex justify-between px-5 py-3">
                <span className="text-sm text-zinc-400">Kategori</span>
                <span className="text-sm font-medium text-white">
                  {category ? CATEGORY_CONFIG[category as ItemCategory].label : '-'}
                </span>
              </div>
              {rewardOffered && (
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-zinc-400">Reward</span>
                  <span className="text-sm font-medium text-amber-400">Ada hadiah</span>
                </div>
              )}
            </div>

            <Link
              href={createdItemId ? `/barang/${createdItemId}` : '/barang'}
              className="w-full bg-white text-black font-semibold rounded-lg px-4 py-3 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={16} /> Selesai & Lihat Barang
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
