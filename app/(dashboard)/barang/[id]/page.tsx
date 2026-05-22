import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ItemDetailClient from './ItemDetailClient';
import { cookies } from 'next/headers';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true';

  if (isDemo) {
    const mockItem = {
      id: id,
      user_id: 'demo123',
      item_name: id === '1' ? 'MacBook Pro M2' : id === '2' ? 'Dompet Kulit' : 'Kunci Motor',
      item_category: id === '1' ? 'elektronik' : id === '2' ? 'dompet' : 'kunci',
      qr_code: `BALIK-DEMO-${id}`,
      status: id === '1' ? 'active' : id === '2' ? 'lost' : 'returned',
      is_active: true,
      created_at: new Date().toISOString(),
      contact_preference: 'both',
      reward_offered: id === '2',
      reward_amount: id === '2' ? 50000 : null,
      reward_message: id === '2' ? 'Tolong kembalikan' : null,
      total_scans: id === '1' ? 0 : 3
    };

    const mockSessions = id === '1' ? [] : [
      {
        id: 'session-1',
        item_id: id,
        session_token: 'token123',
        finder_location_name: 'Gedung B UAJY',
        status: 'open',
        created_at: new Date().toISOString(),
        initial_message: 'Saya temukan barang ini'
      }
    ];

    return <ItemDetailClient item={mockItem as any} sessions={mockSessions as any} />;
  }
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!item) notFound();

  const { data: sessions } = await supabase
    .from('scan_sessions')
    .select('*')
    .eq('item_id', item.id)
    .order('created_at', { ascending: false });

  return <ItemDetailClient item={item} sessions={sessions || []} />;
}
