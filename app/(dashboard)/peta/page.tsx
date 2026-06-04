import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import PetaClient from './PetaClient';
import { getDemoDashboardData } from '@/lib/demo/server';

export const metadata = { title: 'Peta Temuan — Balik.In' };

export default async function PetaPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    const demoData = await getDemoDashboardData();
    const sessionsWithLocation = demoData.sessions.filter(
      (session) => session.finder_latitude && session.finder_longitude
    );
    return <PetaClient sessions={sessionsWithLocation as any} />;
  }

  if (!user) redirect('/login');

  const { data: sessions } = await supabase
    .from('scan_sessions')
    .select('*, items!inner(user_id, item_name, item_category, qr_code)')
    .eq('items.user_id', user.id)
    .not('finder_latitude', 'is', null)
    .not('finder_longitude', 'is', null)
    .order('created_at', { ascending: false });

  return <PetaClient sessions={sessions || []} />;
}
