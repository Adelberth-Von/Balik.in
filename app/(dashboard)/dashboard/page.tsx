import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard — Balik.In',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return (
      <DashboardClient
        profile={{ id: 'demo123', full_name: 'Sobat Demo', email: 'demo@balik.in', phone_number: '08123456789' } as any}
        items={[
          { id: '1', user_id: 'demo123', item_name: 'MacBook Pro M2', item_category: 'elektronik', qr_code: 'BALIK-DEMO-1', status: 'active', is_active: true, created_at: new Date().toISOString() } as any,
          { id: '2', user_id: 'demo123', item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DEMO-2', status: 'lost', is_active: true, created_at: new Date().toISOString() } as any,
          { id: '3', user_id: 'demo123', item_name: 'Kunci Motor', item_category: 'kunci', qr_code: 'BALIK-DEMO-3', status: 'returned', is_active: true, created_at: new Date().toISOString() } as any,
        ]}
        sessions={[
          { id: 's1', item_id: '2', session_token: 'tok_1', finder_location_name: 'Perpustakaan UAJY', status: 'open', is_read_by_owner: false, created_at: new Date().toISOString(), items: { item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DEMO-2' } } as any,
        ]}
        notifications={[]}
        userId="demo123"
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
