'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardShell({
  children,
  unreadCount,
  unreadMessages,
}: {
  children: React.ReactNode;
  unreadCount: number;
  unreadMessages: number;
}) {
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-zinc-50">
      <div
        className={
          sidebarHidden
            ? '[&>aside]:-translate-x-full [&>aside]:pointer-events-none'
            : ''
        }
      >
        <Sidebar unreadCount={unreadCount} unreadMessages={unreadMessages} />
      </div>

      <button
        type="button"
        onClick={() => setSidebarHidden((value) => !value)}
        className="fixed left-3 top-24 z-50 hidden h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 shadow-lg transition-colors hover:bg-zinc-900 hover:text-white md:flex"
        aria-label={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
        title={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
      >
        {sidebarHidden ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <main
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarHidden ? 'md:ml-0' : 'md:ml-64'
        }`}
      >
        <div className="pb-20 md:pb-0">{children}</div>
      </main>

      <BottomNav unreadCount={unreadCount} unreadMessages={unreadMessages} />
    </div>
  );
}
