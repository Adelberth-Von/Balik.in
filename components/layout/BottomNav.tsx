'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, MessageSquare, Bell, User, Map } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/barang', label: 'Barang', icon: Package },
  { href: '/peta', label: 'Peta', icon: Map },
  { href: '/notifikasi', label: 'Notifikasi', icon: Bell },
  { href: '/pesan', label: 'Pesan', icon: MessageSquare },
  { href: '/profil', label: 'Profil', icon: User },
];

export default function BottomNav({
  unreadCount = 0,
  unreadMessages = 0,
}: {
  unreadCount?: number;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  
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
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-around px-1">
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
              className="relative flex flex-col items-center justify-center flex-1 py-3.5 gap-1 transition-colors"
            >
              {/* Active indicator top line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-white rounded-b-full" />
              )}
              <div className="relative">
                <Icon
                  size={21}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-white' : 'text-zinc-500'
                  )}
                />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] min-w-[14px] h-[14px] px-0.5 flex items-center justify-center font-bold rounded-full">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-medium leading-none mt-1',
                  isActive ? 'text-white' : 'text-zinc-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
