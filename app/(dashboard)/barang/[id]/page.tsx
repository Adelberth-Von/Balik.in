import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ItemDetailClient from './ItemDetailClient';
import { cookies } from 'next/headers';
import { getDemoItemDetail } from '@/lib/demo/server';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isDemo = cookieStore.get('demo_mode')?.value === 'true' || user?.email === 'demo@balik.in';

  if (isDemo) {
    const demoDetail = await getDemoItemDetail(id);
    const item = demoDetail.item || {
      id,
      user_id: 'demo123',
      item_name: 'Barang Demo',
      item_category: 'lainnya',
      qr_code: `BALIK-DEMO-${id}`,
      status: 'active',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contact_preference: 'both',
      reward_offered: false,
      total_scans: 0
    };

    return <ItemDetailClient item={item as any} sessions={demoDetail.sessions as any} />;
  }
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
