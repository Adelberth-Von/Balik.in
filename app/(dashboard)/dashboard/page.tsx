import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — Balik.In',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const isDemoCookie = cookieStore.get('demo_mode')?.value === 'true';
  const isAdmin = user?.email === 'admin@balik.in';
  const isDemo = isDemoCookie || isAdmin;

  if (isDemo) {
    return (
      <DashboardClient
        profile={{ id: 'demo123', full_name: 'Sobat Demo', email: 'demo@balik.in', phone_number: '08123456789' } as any}
        items={[
          { id: '1', user_id: 'demo123', item_name: 'MacBook Pro M2', item_category: 'elektronik', qr_code: 'BALIK-DEMO-1', status: 'active', is_active: true, created_at: new Date().toISOString() } as any,
          { id: '2', user_id: 'demo123', item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DEMO-2', status: 'lost', is_active: true, created_at: new Date(Date.now() - 86400000).toISOString() } as any,
          { id: '3', user_id: 'demo123', item_name: 'Kunci Motor', item_category: 'kunci', qr_code: 'BALIK-DEMO-3', status: 'returned', is_active: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() } as any,
          { id: '4', user_id: 'demo123', item_name: 'Tas Ransel Eiger', item_category: 'tas', qr_code: 'BALIK-DEMO-4', status: 'active', is_active: true, created_at: new Date(Date.now() - 86400000 * 3).toISOString() } as any,
          { id: '5', user_id: 'demo123', item_name: 'Botol Minum Corkcicle', item_category: 'botol', qr_code: 'BALIK-DEMO-5', status: 'active', is_active: true, created_at: new Date(Date.now() - 86400000 * 4).toISOString() } as any,
          { id: '6', user_id: 'demo123', item_name: 'Jaket Hoodie', item_category: 'pakaian', qr_code: 'BALIK-DEMO-6', status: 'lost', is_active: true, created_at: new Date(Date.now() - 86400000 * 5).toISOString() } as any,
          { id: '7', user_id: 'demo123', item_name: 'Buku Catatan Kuliah', item_category: 'buku', qr_code: 'BALIK-DEMO-7', status: 'active', is_active: true, created_at: new Date(Date.now() - 86400000 * 6).toISOString() } as any,
          { id: '8', user_id: 'demo123', item_name: 'KTP & SIM', item_category: 'dokumen', qr_code: 'BALIK-DEMO-8', status: 'found', is_active: true, created_at: new Date(Date.now() - 86400000 * 7).toISOString() } as any,
        ]}
        sessions={[
          { id: 's1', item_id: '2', session_token: 'tok_1', finder_location_name: 'Perpustakaan UAJY', status: 'open', is_read_by_owner: false, created_at: new Date().toISOString(), items: { item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DEMO-2' } } as any,
        ]}
        notifications={[]}
        userId="demo123"
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
