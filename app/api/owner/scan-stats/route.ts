import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ItemScanStats = {
  total_scans: number;
  last_scanned_at: string | null;
};

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, stats: {} }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('scan_sessions')
    .select('item_id, created_at, items!inner(user_id)')
    .eq('items.user_id', user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message, stats: {} },
      { status: 500 }
    );
  }

  const stats = (data || []).reduce<Record<string, ItemScanStats>>((acc, session) => {
    const itemId = session.item_id as string;
    const createdAt = session.created_at as string;
    const current = acc[itemId] || { total_scans: 0, last_scanned_at: null };

    current.total_scans += 1;
    if (!current.last_scanned_at || new Date(createdAt) > new Date(current.last_scanned_at)) {
      current.last_scanned_at = createdAt;
    }

    acc[itemId] = current;
    return acc;
  }, {});

  return NextResponse.json({ ok: true, stats });
}
