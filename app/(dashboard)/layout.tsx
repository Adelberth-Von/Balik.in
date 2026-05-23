import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import DemoBanner from '@/components/layout/DemoBanner';
import ForceTheme from '@/components/layout/ForceTheme';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isDemoCookie = cookieStore.get('demo_mode')?.value === 'true';
  const isAdmin = user?.email === 'admin@balik.in';
  const isDemoMode = isDemoCookie || isAdmin;

  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-50">
        <ForceTheme mode="auto" />
        <DemoBanner />
        <Sidebar unreadCount={2} unreadMessages={1} />
        <main className="md:ml-64 min-h-screen">
          <div className="pb-20 md:pb-0">{children}</div>
        </main>
        <BottomNav unreadCount={2} unreadMessages={1} />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isDemoUser = user.email === 'demo@balik.in';

  const [{ count: unreadNotifs }, { count: unreadMsgs }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    supabase
      .from('scan_sessions')
      .select('items!inner(*)', { count: 'exact', head: true })
      .eq('is_read_by_owner', false)
      .eq('items.user_id', user.id)
      .eq('status', 'open'),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-50">
      <ForceTheme mode="auto" />
      {isDemoUser && <DemoBanner />}
      <Sidebar unreadCount={unreadNotifs || 0} unreadMessages={unreadMsgs || 0} />
      <main className="md:ml-64 min-h-screen">
        <div className="pb-20 md:pb-0">{children}</div>
      </main>
      <BottomNav unreadCount={unreadNotifs || 0} unreadMessages={unreadMsgs || 0} />
    </div>
  );
}
