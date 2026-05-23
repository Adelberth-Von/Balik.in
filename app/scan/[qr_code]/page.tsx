'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Send, MessageSquare, QrCode, Shield, AlertCircle,
  CheckCircle2, RefreshCw, Home, Navigation, Loader2, Gift
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_CONFIG } from '@/lib/types';
import type { Item } from '@/lib/types';
import { reverseGeocode } from '@/lib/utils/geocoding';
import { useGeolocation } from '@/lib/hooks/useGeolocation';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('@/components/scan/MiniMap'), { ssr: false });

type PageState = 'loading' | 'found' | 'submitted' | 'not_found';

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const qrCode = params.qr_code as string;
  const supabase = createClient();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [item, setItem] = useState<Item | null>(null);
  const [message, setMessage] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [locationName, setLocationName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const geo = useGeolocation();

  // Check localStorage for existing session
  useEffect(() => {
    const stored = localStorage.getItem(`baljn_session_${qrCode}`);
    if (stored) {
      // Redirect to existing chat
      router.replace(`/scan/${qrCode}/chat/${stored}`);
      return;
    }
    fetchItem();
  }, [qrCode]);

  // Reverse geocode when GPS obtained
  useEffect(() => {
    if (geo.latitude && geo.longitude && !locationName) {
      reverseGeocode(geo.latitude, geo.longitude).then((result) => {
        if (result) setLocationName(result.short_name);
      });
    }
  }, [geo.latitude, geo.longitude]);

  const fetchItem = async () => {
    if (qrCode.startsWith('BALIK-DEMO-')) {
      const demoId = qrCode.replace('BALIK-DEMO-', '');
      setItem({
        id: demoId,
        user_id: 'demo123',
        item_name: demoId === '1' ? 'MacBook Pro M2' : demoId === '2' ? 'Dompet Kulit' : 'Kunci Motor',
        item_category: demoId === '1' ? 'elektronik' : demoId === '2' ? 'dompet' : 'kunci',
        qr_code: qrCode,
        status: demoId === '1' ? 'active' : demoId === '2' ? 'lost' : 'returned',
        is_active: true,
        created_at: new Date().toISOString(),
        contact_preference: 'both',
        reward_offered: demoId === '2',
        reward_amount: demoId === '2' ? 50000 : null,
        reward_message: demoId === '2' ? 'Tolong kembalikan' : null,
        total_scans: demoId === '1' ? 0 : 3
      } as any);
      setPageState('found');
      return;
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('qr_code', qrCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setPageState('not_found');
    } else {
      setItem(data);
      setPageState('found');
      // Increment scan count
      await supabase
        .from('items')
        .update({ total_scans: (data.total_scans || 0) + 1, last_scanned_at: new Date().toISOString() })
        .eq('qr_code', qrCode);
    }
  };

  const handleShareLocation = () => {
    geo.getCurrentPosition();
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    if (!item) return;
    setSubmitting(true);

    try {
      let token = crypto.randomUUID();

      if (qrCode.startsWith('BALIK-DEMO-')) {
        // Link demo items to their hardcoded tokens in the dashboard mock!
        const demoId = qrCode.replace('BALIK-DEMO-', '');
        token = demoId === '2' ? 'tok_1' : `tok_${demoId}`;
        
        const initialMessages: any[] = [
          { id: 'm1', session_id: token, sender_role: 'system', message_type: 'system', message: 'Sesi chat dimulai • ' + new Date().toLocaleString('id-ID'), created_at: new Date().toISOString() },
          { id: 'm2', session_id: token, sender_role: 'finder', message_type: 'text', message: message, created_at: new Date().toISOString() }
        ];

        if (geo.latitude && geo.longitude) {
          initialMessages.push({
            id: 'm3', session_id: token, sender_role: 'finder', message_type: 'location', message: locationName || 'Lokasi penemu',
            location_lat: geo.latitude, location_lng: geo.longitude, location_name: locationName, created_at: new Date().toISOString()
          });
        }

        const sessionPayload = {
          id: token, item_id: '2', session_token: token, 
          finder_latitude: geo.latitude || null,
          finder_longitude: geo.longitude || null,
          finder_location_name: locationName || manualLocation || 'Lokasi Penemu', 
          status: 'open', is_read_by_owner: false, created_at: new Date().toISOString(),
          items: { id: '2', user_id: 'demo123', item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: qrCode }
        };

        // Sync to Server memory API for Incognito cross-browser demo support!
        await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ type: 'CREATE_SESSION', payload: sessionPayload }) });
        for (const msg of initialMessages) {
          await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ type: 'ADD_MESSAGE', payload: msg }) });
        }
        
        router.replace(`/scan/${qrCode}/chat/${token}?role=finder`);
        return;
      }

      // Create scan session
      const sessionPayload = {
        item_id: item.id,
        session_token: token,
        finder_latitude: geo.latitude,
        finder_longitude: geo.longitude,
        finder_location_name: locationName || manualLocation || null,
        finder_location_detail: manualLocation || null,
        finder_device: navigator.userAgent.substring(0, 100),
        initial_message: message,
        status: 'open',
        is_read_by_owner: false,
      };

      console.log('[DEBUG] Submitting session to Supabase:', sessionPayload);

      const { data: session, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert(sessionPayload)
        .select()
        .single();

      console.log('[DEBUG] Supabase session response:', { session, sessionError });

      if (sessionError) throw sessionError;

      // Send initial system message
      await supabase.from('chat_messages').insert([
        {
          session_id: session.id,
          sender_role: 'system',
          message_type: 'system',
          message: 'Sesi chat dimulai • ' + new Date().toLocaleString('id-ID'),
        },
        {
          session_id: session.id,
          sender_role: 'finder',
          message_type: 'text',
          message: message,
        },
      ]);

      // If location shared, send location message
      if (geo.latitude && geo.longitude) {
        await supabase.from('chat_messages').insert({
          session_id: session.id,
          sender_role: 'finder',
          message_type: 'location',
          message: locationName || 'Lokasi penemu',
          location_lat: geo.latitude,
          location_lng: geo.longitude,
          location_name: locationName,
        });
      }

      // Create notification for owner
      const { data: ownerItem } = await supabase
        .from('items')
        .select('user_id')
        .eq('id', item.id)
        .single();

      if (ownerItem) {
        await supabase.from('notifications').insert({
          user_id: ownerItem.user_id,
          type: 'new_scan',
          title: 'QR Dipindai! 📱',
          body: `${CATEGORY_CONFIG[item.item_category].emoji} Barang kategori ${CATEGORY_CONFIG[item.item_category].label} kamu baru dipindai${locationName ? ` di ${locationName}` : ''}`,
          session_id: session.id,
          item_id: item.id,
        });
      }

      // Store session token in localStorage
      localStorage.setItem(`baljn_session_${qrCode}`, token);
      router.replace(`/scan/${qrCode}/chat/${token}`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim pesan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 gradient-blue rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <QrCode size={32} className="text-white" />
          </div>
          <p className="text-slate-500">Memuat informasi barang...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-surface dark:bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-sm w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">QR Code Tidak Ditemukan</h1>
          <p className="text-slate-500 text-sm mb-6">
            QR code ini tidak aktif atau tidak terdaftar di sistem Balik.In.
          </p>
          <Link href="/" className="btn-primary flex items-center justify-center gap-2">
            <Home size={16} /> Kunjungi Balik.In
          </Link>
        </motion.div>
      </div>
    );
  }

  // Removed submitted UI block

  const categoryInfo = item ? CATEGORY_CONFIG[item.item_category] : null;

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-900">
      {/* Header - App Like */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 text-center sticky top-0 z-20">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md">
            <QrCode size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">Balik<span className="text-primary-600">.In</span></span>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4 pb-8">
        {/* Item Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 rounded-full" />
              <div className={`relative w-24 h-24 ${categoryInfo?.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl shadow-inner border border-white/50 dark:border-slate-700/50`}>
                {categoryInfo?.emoji}
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Barang Ditemukan!
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-[250px] mx-auto">
              Seseorang sedang mencari <span className="font-semibold text-slate-800 dark:text-slate-200">{categoryInfo?.label}</span> ini.
            </p>
          </div>

          {/* Reward Banner */}
          {item?.reward_offered && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-amber-500/20">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-xl shrink-0">
                  <Gift size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight mb-1">
                    Ada Imbalan Menarik!
                  </p>
                  <p className="text-amber-100 text-xs font-medium mb-1">
                    {item.reward_message}
                  </p>
                  {item.reward_amount && (
                    <div className="inline-block bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold mt-1">
                      Rp {item.reward_amount.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lost Status Banner */}
          {item?.status === 'lost' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl p-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-800 dark:text-red-300 text-xs font-semibold leading-relaxed">
                  Pemilik sangat berharap barang ini kembali. Mohon bantuannya ya!
                </p>
              </div>
            </div>
          )}

          {/* Privacy Banner */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-start gap-3">
            <Shield size={20} className="text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1">
                Identitasmu 100% Aman
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                Pemilik tidak akan melihat nama, nomor HP, atau kontakmu. Sistem chat dienkripsi dan sepenuhnya anonim.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Location Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <MapPin size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Lokasi Penemuan</h2>
              <p className="text-xs text-slate-500">Bantu pemilik melacak barangnya</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!geo.granted && !geo.loading && (
              <motion.button
                key="share-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleShareLocation}
                className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Navigation size={18} className="text-primary-500" /> Deteksi Lokasi Otomatis (GPS)
              </motion.button>
            )}

            {geo.loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-4 text-slate-500 mb-3"
              >
                <Loader2 size={18} className="animate-spin" />
                Mendeteksi lokasi...
              </motion.div>
            )}

            {geo.granted && geo.latitude && geo.longitude && (
              <motion.div
                key="map"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="rounded-xl overflow-hidden mb-2 h-40">
                  <MiniMap lat={geo.latitude} lng={geo.longitude} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 size={15} />
                    <span className="text-sm font-medium">{locationName || 'Lokasi terdeteksi'}</span>
                  </div>
                  <button
                    onClick={handleShareLocation}
                    className="text-xs text-primary-600 flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw size={11} /> Perbarui
                  </button>
                </div>
              </motion.div>
            )}

            {geo.error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-3"
              >
                ⚠️ Lokasi tidak dibagikan. Kamu bisa tulis manual di bawah.
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm text-slate-500 mb-1.5">
              Atau tulis lokasi secara manual (opsional)
            </label>
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              className="input-field"
              placeholder="Contoh: Gedung B UAJY lantai 2, dekat lift"
            />
          </div>
        </motion.div>

        {/* Message Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-secondary-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Pesan Pertama</h2>
              <p className="text-xs text-slate-500">Mulai chat anonim dengan pemilik</p>
            </div>
          </div>

          <div className="mb-6">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setCharCount(e.target.value.length);
              }}
              maxLength={500}
              rows={4}
              className={`w-full px-4 py-3 rounded-2xl border transition-all resize-none shadow-inner text-sm focus:outline-none focus:ring-2 ${
                !message.trim() 
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-slate-500 focus:border-slate-500' 
                  : 'border-green-500 bg-green-50/10 dark:bg-green-900/10 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-green-500 focus:border-green-500'
              }`}
              placeholder="Contoh: Halo, saya menemukan barangmu di meja perpustakaan..."
            />
            <div className={`text-right text-xs font-medium mt-2 ${!message.trim() ? 'text-slate-400' : 'text-green-500'}`}>{charCount}/500</div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
            className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-lg ${
              !message.trim() || submitting
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30 active:scale-95'
            }`}
          >
            {submitting ? (
              <><Loader2 size={20} className="animate-spin" /> Mengirim Pesan...</>
            ) : (
              <><Send size={20} /> Mulai Chat Anonim</>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
            <Shield size={11} /> Pesanmu bersifat anonim
          </p>
        </motion.div>
      </div>
    </div>
  );
}
