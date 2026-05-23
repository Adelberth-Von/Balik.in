'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Package,
  MessageSquare,
  Map,
  Bell,
  User,
  QrCode,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/barang', label: 'Barang Saya', icon: Package },
  { href: '/pesan', label: 'Pesan & Chat', icon: MessageSquare },
  { href: '/peta', label: 'Peta Temuan', icon: Map },
  { href: '/notifikasi', label: 'Notifikasi', icon: Bell },
  { href: '/profil', label: 'Profil', icon: User },
];

export default function Sidebar({ unreadCount = 0, unreadMessages = 0 }: { unreadCount?: number; unreadMessages?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();
  const supabase = createClient();

  const [liveUnreadMsgs, setLiveUnreadMsgs] = useState(unreadMessages);
  const [liveUnreadCount, setLiveUnreadCount] = useState(unreadCount);

  useEffect(() => {
    setLiveUnreadMsgs(unreadMessages);
    setLiveUnreadCount(unreadCount);
  }, [unreadMessages, unreadCount]);

  useEffect(() => {
    const handleAllRead = () => setLiveUnreadCount(0);
    const handleSingleRead = () => setLiveUnreadCount(prev => Math.max(0, prev - 1));
    
    window.addEventListener('notifications_read', handleAllRead);
    window.addEventListener('notification_read', handleSingleRead as EventListener);
    
    return () => {
      window.removeEventListener('notifications_read', handleAllRead);
      window.removeEventListener('notification_read', handleSingleRead as EventListener);
    };
  }, []);

  useEffect(() => {
    const isDemo = document.cookie.includes('demo_mode=true');
    if (!isDemo) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/demo');
        const sessions = await res.json();
        const unread = sessions.filter((s: any) => !s.is_read_by_owner).length;
        setLiveUnreadMsgs(unread);
        // We don't simulate notifications in demo yet, so we keep it as is
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      // Call server action to guarantee HttpOnly cookies are cleared
      const { logoutAction } = await import('@/app/actions/auth');
      await logoutAction();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Berhasil keluar');
      window.location.href = '/'; 
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800/60 min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800/60">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <QrCode size={17} className="text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Balik.In
          </span>
        </Link>
      </div>

      {/* User Info */}
      {profile && (
        <div className="px-4 py-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="w-8 h-8 bg-white flex items-center justify-center font-bold text-sm text-black rounded-full shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-white truncate leading-tight">{profile.full_name}</p>
              <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badge =
            item.href === '/notifikasi'
              ? liveUnreadCount
              : item.href === '/pesan'
              ? liveUnreadMsgs
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group border-l-2',
                isActive
                  ? 'bg-zinc-800/50 border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-zinc-800/60 p-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-800/50 hover:text-white transition-all"
        >
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
