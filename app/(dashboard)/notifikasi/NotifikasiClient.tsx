'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, QrCode, MessageSquare, CheckCircle2, Star, Settings } from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/types';
import { timeAgo } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import { useNotificationsRealtime } from '@/lib/hooks/useRealtime';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  new_scan: {
    icon: <QrCode size={15} />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border border-blue-500/20',
  },
  new_message: {
    icon: <MessageSquare size={15} />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border border-amber-500/20',
  },
  item_returned: {
    icon: <CheckCircle2 size={15} />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border border-emerald-500/20',
  },
  reward_claimed: {
    icon: <Star size={15} />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border border-purple-500/20',
  },
  status_changed: {
    icon: <Settings size={15} />,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800 border border-zinc-700',
  },
  system: {
    icon: <Bell size={15} />,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800 border border-zinc-700',
  },
};

const TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'unread', label: 'Belum Dibaca' },
  { value: 'scan', label: 'Scan' },
  { value: 'message', label: 'Pesan' },
];

export default function NotifikasiClient({ notifications: initialNotifications, userId }: { notifications: Notification[]; userId: string }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [tab, setTab] = useState('all');
  const supabase = createClient();

  useNotificationsRealtime(userId, (notif) => {
    setNotifications((prev) => [notif, ...prev]);
  });

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success('Semua notifikasi ditandai dibaca');
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const filtered = notifications.filter((n) => {
    if (tab === 'unread') return !n.is_read;
    if (tab === 'scan') return n.type === 'new_scan';
    if (tab === 'message') return n.type === 'new_message';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notifikasi</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {notifications.length} total
            {unreadCount > 0 && <span className="text-blue-400 ml-1">· {unreadCount} belum dibaca</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 transition-all"
          >
            <CheckCheck size={14} /> Tandai dibaca
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 min-w-max px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              tab === t.value ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            )}
          >
            {t.label}
            {t.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center">
          <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bell size={22} className="text-zinc-500" />
          </div>
          <p className="font-semibold text-white mb-1">Tidak ada notifikasi</p>
          <p className="text-sm text-zinc-500">Kamu sudah beres semua.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, i) => {
            const tc = TYPE_CONFIG[notif.type];
            const isUnread = !notif.is_read;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => markRead(notif.id)}
                className={cn(
                  'p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/60 transition-all flex items-start gap-4 cursor-pointer',
                  isUnread && 'border-l-[3px] border-l-blue-500'
                )}
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tc.bg, tc.color)}>
                  {tc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold text-white' : 'font-medium text-zinc-300')}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-[11px] text-zinc-600 mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
                {isUnread && <div className="w-2 h-2 bg-blue-400 rounded-full shrink-0 mt-1.5" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
