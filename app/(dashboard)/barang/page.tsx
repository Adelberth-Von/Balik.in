import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ItemsClient from './ItemsClient';
import { getDemoDashboardData } from '@/lib/demo/server';

export const metadata = { title: 'Barang Saya — Balik.In' };

export default async function BarangPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    const demoData = await getDemoDashboardData();
    return <ItemsClient items={demoData.items} />;
  }

  if (!user) redirect('/login');

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <ItemsClient items={items || []} />;
}
