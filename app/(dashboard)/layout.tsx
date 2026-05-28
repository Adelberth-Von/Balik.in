import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ForceTheme from '@/components/layout/ForceTheme';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemoMode = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemoMode) {
    return (
      <>
        <ForceTheme mode="auto" />
        <DashboardShell unreadCount={2} unreadMessages={1} isDemo>{children}</DashboardShell>
      </>
    );
  }

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
    <>
      <ForceTheme mode="auto" />
      <DashboardShell unreadCount={unreadNotifs || 0} unreadMessages={unreadMsgs || 0} isDemo={isDemoUser}>
        {children}
      </DashboardShell>
    </>
  );
}
