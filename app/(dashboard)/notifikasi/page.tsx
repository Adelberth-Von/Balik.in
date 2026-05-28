import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import NotifikasiClient from './NotifikasiClient';

export const metadata = { title: 'Notifikasi — Balik.In' };

export default async function NotifikasiPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    return <NotifikasiClient notifications={[
      { id: 'n1', user_id: 'demo123', type: 'new_scan', title: 'Barang Ditemukan!', body: 'Dompet Kulit telah dipindai di Perpustakaan UAJY.', is_read: false, created_at: new Date().toISOString() } as any,
    ]} userId="demo123" />;
  }

  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <NotifikasiClient notifications={notifications || []} userId={user.id} />;
}
