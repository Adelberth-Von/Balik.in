import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ItemsClient from './ItemsClient';

export const metadata = { title: 'Barang Saya — Balik.In' };

export default async function BarangPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return <ItemsClient items={[
      { id: '1', user_id: 'demo123', item_name: 'MacBook Pro M2', item_category: 'elektronik', qr_code: 'BALIK-MAC-123', status: 'active', is_active: true, created_at: new Date().toISOString() } as any,
      { id: '2', user_id: 'demo123', item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DMP-456', status: 'lost', is_active: true, created_at: new Date().toISOString() } as any,
      { id: '3', user_id: 'demo123', item_name: 'Kunci Motor', item_category: 'kunci', qr_code: 'BALIK-KNC-789', status: 'returned', is_active: true, created_at: new Date().toISOString() } as any,
    ]} />;
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <ItemsClient items={items || []} />;
}
