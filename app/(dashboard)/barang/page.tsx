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

  const [{ data: items }, { data: sessions }] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('scan_sessions')
      .select('item_id, created_at, items!inner(user_id)')
      .eq('items.user_id', user.id),
  ]);

  const scanStats = (sessions || []).reduce<Record<string, { count: number; last: string | null }>>(
    (acc, session) => {
      const current = acc[session.item_id] || { count: 0, last: null };
      current.count += 1;
      if (!current.last || new Date(session.created_at) > new Date(current.last)) {
        current.last = session.created_at;
      }
      acc[session.item_id] = current;
      return acc;
    },
    {}
  );

  const hydratedItems = (items || []).map((item) => {
    const stats = scanStats[item.id];
    if (!stats) return item;

    return {
      ...item,
      total_scans: Math.max(item.total_scans || 0, stats.count),
      last_scanned_at:
        item.last_scanned_at && new Date(item.last_scanned_at) > new Date(stats.last || 0)
          ? item.last_scanned_at
          : stats.last || item.last_scanned_at,
    };
  });

  return <ItemsClient items={hydratedItems} />;
}
