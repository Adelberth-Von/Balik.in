import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import NotifikasiClient from './NotifikasiClient';
import { getDemoDashboardData } from '@/lib/demo/server';

export const metadata = { title: 'Notifikasi — Balik.In' };

export default async function NotifikasiPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    const demoData = await getDemoDashboardData();
    return <NotifikasiClient notifications={demoData.notifications} userId={demoData.profile.id} />;
  }

  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <NotifikasiClient notifications={notifications || []} userId={user.id} />;
}
