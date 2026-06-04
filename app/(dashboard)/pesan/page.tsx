import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import PesanClient from './PesanClient';
import { getDemoDashboardData } from '@/lib/demo/server';

export const metadata = { title: 'Pesan & Chat — Balik.In' };

export default async function PesanPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    const demoData = await getDemoDashboardData();
    return <PesanClient sessions={demoData.sessions as any} />;
  }

  if (!user) redirect('/login');

  const { data: sessions } = await supabase
    .from('scan_sessions')
    .select('*, items!inner(user_id, item_name, item_category, qr_code, id)')
    .eq('items.user_id', user.id)
    .order('created_at', { ascending: false });

  return <PesanClient sessions={sessions || []} />;
}
