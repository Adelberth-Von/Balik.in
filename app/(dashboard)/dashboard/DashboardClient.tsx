'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode, Package, MessageSquare, CheckCircle2, Plus,
  ArrowRight, Activity, MapPin
} from 'lucide-react';
import type { User, Item, ScanSession, Notification } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/types';
import { timeAgo, formatLongDate } from '@/lib/utils/formatters';
import { useNotificationsRealtime } from '@/lib/hooks/useRealtime';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface Props {
  profile: User | null;
  items: Item[];
  sessions: ScanSession[];
  notifications: Notification[];
  userId: string;
}

export default function DashboardClient({ profile, items, sessions, notifications, userId }: Props) {
  const [liveNotifications, setLiveNotifications] = useState(notifications);
  const [isInjecting, setIsInjecting] = useState(false);
  const today = formatLongDate(new Date().toISOString());

  useEffect(() => {
    const injectDummyData = async () => {
      if (profile?.email !== 'admin@balik.in' || items.length > 0 || isInjecting) return;
      
      setIsInjecting(true);
      const supabase = createClient();
      
      try {
        toast.loading('Menyiapkan data presentasi...', { id: 'dummyData' });
        
        const { error: itemsError } = await supabase.from('items').insert([
          { 
            user_id: userId, 
            item_name: 'MacBook Pro M2', 
            category: 'electronics', 
            description: 'Laptop kerja dengan stiker Balik.in',
            qr_code: 'MAC-12345',
            status: 'active',
            is_active: true,
            reward_amount: 500000
          },
          { 
            user_id: userId, 
            item_name: 'Dompet Kulit Hitam', 
            category: 'other', 
            description: 'Berisi KTP dan kartu penting',
            qr_code: 'WLT-67890',
            status: 'active',
            is_active: true,
            reward_amount: 100000
          },
          { 
            user_id: userId, 
            item_name: 'Kunci Mobil Pajero', 
            category: 'other', 
            description: 'Gantungan kunci kulit coklat',
            qr_code: 'KEY-11223',
            status: 'active',
            is_active: true
          }
        ]);
        
        if (itemsError) throw itemsError;
        
        toast.success('Data presentasi siap!', { id: 'dummyData' });
        window.location.reload();
      } catch (error) {
        console.error('Failed to inject dummy data:', error);
        toast.error('Gagal memuat data presentasi', { id: 'dummyData' });
      } finally {
        setIsInjecting(false);
      }
    };

    injectDummyData();
  }, [profile?.email, items.length, userId, isInjecting]);

  useNotificationsRealtime(userId, (notif) => {
    setLiveNotifications((prev) => [notif, ...prev]);
  });

  const activeItems = items.filter((i) => i.is_active);
  const scansThisMonth = sessions.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const unreadMessages = sessions.filter((s) => !s.is_read_by_owner && s.status === 'open').length;
  const returned = items.filter((i) => i.status === 'returned').length;
  const newScans = sessions.filter((s) => !s.is_read_by_owner).length;
  const lostItems = items.filter((i) => i.status === 'lost').length;

  const stats = [
    { label: 'QR Aktif', value: activeItems.length, icon: QrCode, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { label: 'Scan Bulan Ini', value: scansThisMonth, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { label: 'Pesan Baru', value: unreadMessages, icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', pulse: unreadMessages > 0 },
    { label: 'Barang Kembali', value: returned, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
          >
            Halo, {profile?.full_name?.split(' ')[0] || 'Sobat'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-sm md:text-base font-medium capitalize"
          >
            {today}
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/barang/tambah"
            className="group relative inline-flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-full px-6 py-3 overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus size={18} className="relative z-10" />
            <span className="relative z-10">Tambah Barang</span>
          </Link>
        </motion.div>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        {newScans > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden flex items-center justify-between p-4 md:px-6 md:py-4 bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl backdrop-blur-sm"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              <span className="text-blue-100 text-sm font-medium">
                {newScans} pindaian QR baru membutuhkan perhatian Anda
              </span>
            </div>
            <Link href="/pesan" className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors shrink-0 flex items-center gap-1 group">
              Tinjau <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
        
        {lostItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden flex items-center justify-between p-4 md:px-6 md:py-4 bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl backdrop-blur-sm"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="text-rose-100 text-sm font-medium">
                {lostItems} barang dilaporkan hilang
              </span>
            </div>
            <Link href="/barang" className="text-rose-400 text-sm font-semibold hover:text-rose-300 transition-colors shrink-0 flex items-center gap-1 group">
              Kelola <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>

      {/* Premium Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.1 }}
              className="group relative p-6 bg-zinc-900/40 hover:bg-zinc-800/40 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-3xl transition-all duration-300 overflow-hidden"
            >
              {/* Subtle top gradient glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="flex justify-between items-start mb-4">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3', stat.bg, stat.color, stat.border)}>
                  <Icon size={18} />
                </div>
                {stat.pulse && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </div>
              
              <div>
                <p className="text-4xl font-bold tracking-tight text-white mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lists Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-1 md:p-6 bg-transparent md:bg-zinc-900/20 md:border border-white/5 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6 px-3 md:px-0">
            <h2 className="font-bold text-lg text-white">Aktivitas Terbaru</h2>
          </div>
          
          <div className="space-y-2">
            {sessions.slice(0, 5).length === 0 ? (
              <div className="py-12 px-6 text-center bg-zinc-900/30 border border-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity size={20} className="text-zinc-500" />
                </div>
                <p className="text-zinc-400 text-sm">Belum ada aktivitas pindai sejauh ini.</p>
              </div>
            ) : (
              sessions.slice(0, 5).map((session, i) => {
                const itemData = (session as ScanSession & { items: Item }).items;
                const isNew = !session.is_read_by_owner;
                return (
                  <Link
                    key={session.id}
                    href={`/scan/${itemData?.qr_code}/chat/${session.session_token}`}
                    className="group flex items-center justify-between gap-4 p-4 bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border', isNew ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400')}>
                          <MessageSquare size={16} />
                        </div>
                        {isNew && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#09090b]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-zinc-200 truncate group-hover:text-white transition-colors">
                          {itemData?.item_name || 'Barang'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                          {session.finder_location_name ? (
                            <><MapPin size={10} /><span className="truncate">{session.finder_location_name}</span></>
                          ) : 'Lokasi disembunyikan'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[11px] font-medium text-zinc-500">{timeAgo(session.created_at)}</span>
                      <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Inventory Quick View */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="p-1 md:p-6 bg-transparent md:bg-zinc-900/20 md:border border-white/5 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-6 px-3 md:px-0">
            <h2 className="font-bold text-lg text-white">Inventaris Anda</h2>
            <Link href="/barang" className="text-sm font-semibold text-zinc-400 hover:text-white flex items-center gap-1 group transition-colors">
              Lihat Semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="space-y-2">
            {items.slice(0, 5).length === 0 ? (
              <div className="py-12 px-6 text-center bg-zinc-900/30 border border-white/5 rounded-2xl">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package size={20} className="text-zinc-500" />
                </div>
                <p className="text-zinc-400 text-sm">Inventaris masih kosong.</p>
              </div>
            ) : (
              items.slice(0, 5).map((item) => {
                const statusInfo = STATUS_CONFIG[item.status];
                return (
                  <Link
                    key={item.id}
                    href={`/barang/${item.id}`}
                    className="group flex items-center justify-between gap-4 p-4 bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-zinc-200 truncate group-hover:text-white transition-colors">{item.item_name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono truncate tracking-wide">{item.qr_code}</p>
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border', statusInfo.className.replace('bg-', 'bg-opacity-10 border-').replace('text-', 'text-'))}>
                      {statusInfo.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
