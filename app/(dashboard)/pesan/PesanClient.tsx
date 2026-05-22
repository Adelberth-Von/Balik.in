'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, MapPin, Package, Search, Clock, ChevronRight } from 'lucide-react';
import type { ScanSession, Item } from '@/lib/types';
import { timeAgo } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

type SessionWithItem = ScanSession & { items: Item };

const TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'unread', label: 'Belum Dibaca' },
  { value: 'open', label: 'Aktif' },
  { value: 'returned', label: 'Selesai' },
];

export default function PesanClient({ sessions }: { sessions: SessionWithItem[] }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [localSessions, setLocalSessions] = useState<SessionWithItem[]>(sessions);

  // Sync localSessions when the server sessions prop updates (e.g., via router.refresh)
  useEffect(() => {
    setLocalSessions(sessions);
  }, [sessions]);
  const router = useRouter();

  // Sync demo sessions from Server memory API
  useEffect(() => {
    const isDemo = sessions.some(s => s.items?.qr_code?.startsWith('BALIK-DEMO-'));
    if (!isDemo) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/demo');
        const demoSessions = await res.json();
        if (demoSessions.length > 0) {
          // Merge with initial sessions so we don't lose the hardcoded ones if not present
          setLocalSessions(prev => {
            const newSessions = [...prev];
            for (const ds of demoSessions) {
              const idx = newSessions.findIndex(s => s.session_token === ds.session_token);
              if (idx >= 0) newSessions[idx] = ds;
              else newSessions.unshift(ds);
            }
            return newSessions;
          });
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [sessions]);

  // Polling for real backend updates
  useEffect(() => {
    const isDemo = sessions.some(s => s.items?.qr_code?.startsWith('BALIK-DEMO-'));
    if (isDemo) return;

    // Refresh the server component data every 5 seconds
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router, sessions]);

  const filtered = localSessions.filter((s) => {
    const matchTab =
      tab === 'unread' ? !s.is_read_by_owner :
      tab === 'open' ? s.status === 'open' :
      tab === 'returned' ? (s.status === 'returned' || s.status === 'closed') :
      true;
    const matchSearch = !search || s.items?.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.finder_location_name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const unreadCount = localSessions.filter((s) => !s.is_read_by_owner).length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pesan & Chat</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {sessions.length} percakapan
            {unreadCount > 0 && <span className="text-blue-400 ml-1">· {unreadCount} belum dibaca</span>}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan nama barang atau lokasi..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 min-w-max px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              tab === t.value
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            {t.label}
            {t.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
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
            <MessageSquare size={22} className="text-zinc-500" />
          </div>
          <p className="font-semibold text-white mb-1">Tidak ada pesan</p>
          <p className="text-sm text-zinc-500">
            {tab === 'unread' ? 'Semua pesan sudah dibaca.' : 'Belum ada percakapan di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((session, i) => {
            const item = session.items;
            const isUnread = !session.is_read_by_owner;
            return (
              <motion.button
                key={session.session_token}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/scan/${item?.qr_code}/chat/${session.session_token}`)}
                className={cn(
                  'w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/60 transition-all text-left flex items-center gap-4',
                  isUnread && 'border-l-[3px] border-l-blue-500'
                )}
              >
                {/* Icon */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center">
                    <Package size={18} className="text-zinc-400" />
                  </div>
                  {isUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-900" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-sm truncate', isUnread ? 'font-bold text-white' : 'font-medium text-zinc-200')}>
                      {item?.item_name || 'Barang'}
                    </span>
                    <span className="text-xs text-zinc-500 shrink-0 ml-2">{timeAgo(session.created_at)}</span>
                  </div>
                  {session.finder_location_name && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                      <MapPin size={10} />
                      <span className="truncate">{session.finder_location_name}</span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 truncate">
                    {session.initial_message || 'Tidak ada pesan awal'}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                    session.status === 'returned'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  )}>
                    {session.status === 'returned' ? 'Selesai' : 'Aktif'}
                  </span>
                  <ChevronRight size={14} className="text-zinc-600" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
