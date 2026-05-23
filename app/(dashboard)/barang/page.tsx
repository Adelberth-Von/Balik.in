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
      { id: '1', user_id: 'demo123', item_name: 'MacBook Pro M2', item_category: 'elektronik', qr_code: 'BALIK-DEMO-1', status: 'active', is_active: true, created_at: new Date().toISOString() } as any,
      { id: '2', user_id: 'demo123', item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DEMO-2', status: 'lost', is_active: true, created_at: new Date(Date.now() - 86400000).toISOString() } as any,
      { id: '3', user_id: 'demo123', item_name: 'Kunci Motor', item_category: 'kunci', qr_code: 'BALIK-DEMO-3', status: 'returned', is_active: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() } as any,
      { id: '4', user_id: 'demo123', item_name: 'Tas Ransel Eiger', item_category: 'tas', qr_code: 'BALIK-DEMO-4', status: 'active', is_active: true, created_at: new Date(Date.now() - 86400000 * 3).toISOString() } as any,
      { id: '5', user_id: 'demo123', item_name: 'Botol Minum Corkcicle', item_category: 'botol', qr_code: 'BALIK-DEMO-5', status: 'active', is_active: true, created_at: new Date(Date.now() - 86400000 * 4).toISOString() } as any,
      { id: '6', user_id: 'demo123', item_name: 'Jaket Hoodie', item_category: 'pakaian', qr_code: 'BALIK-DEMO-6', status: 'lost', is_active: true, created_at: new Date(Date.now() - 86400000 * 5).toISOString() } as any,
      { id: '7', user_id: 'demo123', item_name: 'Buku Catatan Kuliah', item_category: 'buku', qr_code: 'BALIK-DEMO-7', status: 'active', is_active: true, created_at: new Date(Date.now() - 86400000 * 6).toISOString() } as any,
      { id: '8', user_id: 'demo123', item_name: 'KTP & SIM', item_category: 'dokumen', qr_code: 'BALIK-DEMO-8', status: 'found', is_active: true, created_at: new Date(Date.now() - 86400000 * 7).toISOString() } as any,
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
