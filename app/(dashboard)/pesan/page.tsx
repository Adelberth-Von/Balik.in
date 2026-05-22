import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import PesanClient from './PesanClient';

export const metadata = { title: 'Pesan & Chat — Balik.In' };

export default async function PesanPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    return <PesanClient sessions={[
      { id: 's1', item_id: '2', session_token: 'tok_1', finder_location_name: 'Perpustakaan UAJY', status: 'open', is_read_by_owner: false, created_at: new Date().toISOString(), items: { id: '2', user_id: 'demo123', item_name: 'Dompet Kulit', item_category: 'dompet', qr_code: 'BALIK-DEMO-2' } } as any,
    ]} />;
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sessions } = await supabase
    .from('scan_sessions')
    .select('*, items!inner(user_id, item_name, item_category, qr_code, id)')
    .eq('items.user_id', user.id)
    .order('created_at', { ascending: false });

  return <PesanClient sessions={sessions || []} />;
}
