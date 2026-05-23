'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, History, MessageSquare, Info, Download, Copy, MapPin, Package, Clock, Eye, CheckCircle } from 'lucide-react';
import type { Item, ScanSession } from '@/lib/types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@/lib/types';
import { timeAgo, formatDateTime } from '@/lib/utils/formatters';
import { getQrUrl } from '@/lib/utils/qr-generator';
import QRCodeLib from 'react-qr-code';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { readPrototypeItems, removePrototypeItem, savePrototypeItem } from '@/lib/utils/demo-items';

const TABS = [
  { id: 'info', label: 'Info', icon: Info },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'scans', label: 'Riwayat', icon: History },
];

export default function ItemDetailClient({ item, sessions }: { item: Item; sessions: ScanSession[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'qr' ? 'qr' : 'info';
  const [currentItem, setCurrentItem] = useState(item);
  const [tab, setTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    item_name: item.item_name,
    item_category: item.item_category,
    item_description: item.item_description || '',
    status: item.status,
    contact_preference: item.contact_preference,
    reward_offered: item.reward_offered,
    reward_amount: item.reward_amount || 0,
    reward_message: item.reward_message || '',
  });
  const supabase = createClient();
  const catInfo = CATEGORY_CONFIG[currentItem.item_category];
  const statusInfo = STATUS_CONFIG[currentItem.status];
  const qrUrl = getQrUrl(currentItem.qr_code);

  useEffect(() => {
    const storedItem = readPrototypeItems().find((candidate) => candidate.id === item.id);
    if (!storedItem) return;
    setCurrentItem(storedItem);
    setEditData({
      item_name: storedItem.item_name,
      item_category: storedItem.item_category,
      item_description: storedItem.item_description || '',
      status: storedItem.status,
      contact_preference: storedItem.contact_preference,
      reward_offered: storedItem.reward_offered,
      reward_amount: storedItem.reward_amount || 0,
      reward_message: storedItem.reward_message || '',
    });
  }, [item.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success('Link berhasil disalin!');
  };

  const handleDownloadQr = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const el = document.getElementById('item-qr-area');
      if (!el) return;
      const dataUrl = await toPng(el, { pixelRatio: 3 });
      const a = document.createElement('a');
      a.download = `balik-in-${currentItem.qr_code}.png`;
      a.href = dataUrl;
      a.click();
      toast.success('QR berhasil didownload!');
    } catch {
      toast.error('Gagal download QR');
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      if (currentItem.user_id === 'demo123' || currentItem.qr_code.startsWith('BALIK-DEMO-')) {
        const updatedItem = { ...currentItem, ...editData };
        savePrototypeItem(updatedItem);
        setCurrentItem(updatedItem);
        toast.success('Barang demo berhasil diperbarui!');
        setIsEditing(false);
        return;
      }

      const { error } = await supabase.from('items').update(editData).eq('id', currentItem.id);
      if (error) throw error;
      toast.success('Barang berhasil diperbarui!');
      setIsEditing(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui barang');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus barang ini secara permanen?')) return;
    setIsDeleting(true);
    try {
      if (currentItem.user_id === 'demo123' || currentItem.qr_code.startsWith('BALIK-DEMO-')) {
        removePrototypeItem(currentItem.id);
        toast.success('Barang prototype dihapus!');
        router.push('/barang');
        return;
      }

      const { error } = await supabase.from('items').delete().eq('id', currentItem.id);
      if (error) throw error;
      toast.success('Barang dihapus!');
      router.push('/barang');
    } catch {
      toast.error('Gagal menghapus barang');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#09090b' }}>
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{currentItem.item_name}</h1>
            <p className="text-xs font-mono text-zinc-500">{currentItem.qr_code}</p>
          </div>
          <span className={statusInfo.className}>{statusInfo.label}</span>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{currentItem.total_scans}</p>
            <p className="text-xs text-zinc-500 mt-1">Total Scan</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-white leading-tight">
              {currentItem.last_scanned_at ? timeAgo(currentItem.last_scanned_at) : '-'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Terakhir Scan</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-white">{catInfo.label}</p>
            <p className="text-xs text-zinc-500 mt-1">Kategori</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-5">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                  tab === t.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Info */}
        {tab === 'info' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {isEditing ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 block mb-1">Nama Barang</label>
                  <input type="text" value={editData.item_name} onChange={e => setEditData({...editData, item_name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 block mb-1">Kategori</label>
                  <select value={editData.item_category} onChange={e => setEditData({...editData, item_category: e.target.value as any})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 block mb-1">Deskripsi</label>
                  <textarea value={editData.item_description} onChange={e => setEditData({...editData, item_description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm" rows={2} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 block mb-1">Status</label>
                  <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as any})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm">
                    {Object.entries(STATUS_CONFIG).filter(([k]) => ['active','lost','found','returned'].includes(k)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-500">Tawarkan Imbalan</label>
                    <button
                      type="button"
                      onClick={() => setEditData({...editData, reward_offered: !editData.reward_offered})}
                      className={`relative w-9 h-5 rounded-full transition-all duration-300 ${editData.reward_offered ? 'bg-white' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-300 ${editData.reward_offered ? 'translate-x-4 bg-black' : 'translate-x-0.5 bg-zinc-400'}`} />
                    </button>
                  </div>
                  {editData.reward_offered && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 block mb-1">Pesan Reward</label>
                        <textarea value={editData.reward_message} onChange={e => setEditData({...editData, reward_message: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm" rows={2} placeholder="Pesan imbalan..." />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 block mb-1">Nominal (Rp)</label>
                        <input type="number" value={editData.reward_amount || ''} onChange={e => setEditData({...editData, reward_amount: parseInt(e.target.value) || 0})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm" placeholder="Contoh: 50000" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-white text-sm font-semibold">Batal</button>
                  <button onClick={handleUpdate} disabled={isSaving} className="flex-1 py-2 rounded-lg bg-white text-black text-sm font-semibold">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </div>
            ) : (
              <>
                {/* Main Info Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-white text-base">{currentItem.item_name}</h2>
                        <p className="text-sm text-zinc-400 mt-0.5">{catInfo.label}</p>
                        {currentItem.item_description && (
                          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{currentItem.item_description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detail Row */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-zinc-400">Status</span>
                    <span className={statusInfo.className}>{statusInfo.label}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-zinc-400">Kategori</span>
                    <span className="text-sm font-medium text-white">{catInfo.label}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-zinc-400">Preferensi Kontak</span>
                    <span className="text-sm font-medium text-white capitalize">{currentItem.contact_preference}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-zinc-400">Reward</span>
                    <span className={`text-sm font-medium ${currentItem.reward_offered ? 'text-amber-400' : 'text-zinc-500'}`}>
                      {currentItem.reward_offered ? `Rp ${currentItem.reward_amount?.toLocaleString('id-ID') || 'Ada'}` : 'Tidak ada'}
                    </span>
                  </div>
                </div>

                {currentItem.reward_offered && currentItem.reward_message && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-1">Pesan Reward</p>
                    <p className="text-sm text-amber-300">{currentItem.reward_message}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => setIsEditing(true)} className="py-2.5 rounded-lg bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors">Edit Barang</button>
                  <button onClick={handleDelete} disabled={isDeleting} className="py-2.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors">{isDeleting ? 'Menghapus...' : 'Hapus Barang'}</button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Tab: QR Code */}
        {tab === 'qr' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* QR Display */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div
                id="item-qr-area"
                className="bg-white p-6 rounded-2xl inline-block mx-auto mb-5"
              >
                <QRCodeLib value={qrUrl} size={180} bgColor="#ffffff" fgColor="#09090b" />
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-xs text-zinc-500 font-mono">{currentItem.qr_code}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">balik.in — Scan untuk kembalikan</p>
                </div>
              </div>

              {/* URL */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-left mb-5">
                <p className="text-xs text-zinc-500 mb-0.5">URL Publik</p>
                <p className="text-xs font-mono text-zinc-300 break-all leading-relaxed">{qrUrl}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadQr}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
                >
                  <Download size={15} /> Download PNG
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
                >
                  <Copy size={15} /> Salin Link
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tempelkan QR code ini pada barang Anda. Saat seseorang menemukan barang dan scan kode ini, mereka bisa langsung menghubungi Anda melalui chat anonim.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tab: Riwayat Scan */}
        {tab === 'scans' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {sessions.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <History size={22} className="text-zinc-500" />
                </div>
                <p className="font-semibold text-white mb-1">Belum ada riwayat</p>
                <p className="text-sm text-zinc-500">QR code ini belum pernah dipindai siapapun.</p>
              </div>
            ) : (
              <div className="scrollbar-stable max-h-[calc(100dvh-15rem)] space-y-3 overflow-y-auto pr-1">
                {sessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                  >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {!session.is_read_by_owner && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{formatDateTime(session.created_at)}</p>
                        {session.finder_location_name && (
                          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                            <MapPin size={10} />
                            {session.finder_location_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full border',
                      session.status === 'returned'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    )}>
                      {session.status === 'returned' ? 'Selesai' : 'Aktif'}
                    </span>
                  </div>

                  {session.initial_message && (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-zinc-400 italic">"{session.initial_message}"</p>
                    </div>
                  )}

                  <Link
                    href={`/scan/${currentItem.qr_code}/chat/${session.session_token}`}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MessageSquare size={12} /> Buka Chat
                    {!session.is_read_by_owner && (
                      <span className="bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5 leading-none">Baru</span>
                    )}
                  </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
