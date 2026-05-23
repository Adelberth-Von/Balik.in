'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import DemoBanner from '@/components/layout/DemoBanner';

export default function DashboardShell({
  children,
  unreadCount,
  unreadMessages,
  isDemo = false,
}: {
  children: React.ReactNode;
  unreadCount: number;
  unreadMessages: number;
  isDemo?: boolean;
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
        className={`fixed top-1/2 z-50 hidden h-11 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-zinc-800 bg-zinc-950/95 text-zinc-300 shadow-lg backdrop-blur transition-[left,background-color,color] duration-300 hover:bg-zinc-900 hover:text-white md:flex ${
          sidebarHidden ? 'left-0' : 'left-64'
        }`}
        aria-label={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
        title={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
      >
        {sidebarHidden ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
      </button>

      <main
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarHidden ? 'md:ml-0' : 'md:ml-64'
        }`}
      >
        {isDemo && <DemoBanner />}
        <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      </main>

      <BottomNav unreadCount={unreadCount} unreadMessages={unreadMessages} />
    </div>
  );
}
