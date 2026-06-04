import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import { getDemoDashboardData } from '@/lib/demo/server';

export const metadata = {
  title: 'Dashboard — Balik.In',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    const demoData = await getDemoDashboardData();

    return (
      <DashboardClient
        profile={demoData.profile}
        items={demoData.items}
        sessions={demoData.sessions as any}
        notifications={demoData.notifications}
        userId={demoData.profile.id}
      />
    );
  }

  if (!user) redirect('/login');

  const [{ data: profile }, { data: items }, { data: sessions }, { data: notifications }] =
    await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase
        .from('scan_sessions')
        .select('*, items!inner(user_id, item_name, item_category, qr_code)')
        .eq('items.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  return (
    <DashboardClient
      profile={profile}
      items={items || []}
      sessions={sessions || []}
      notifications={notifications || []}
      userId={user.id}
    />
  );
}
