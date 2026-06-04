import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, sessions: [] }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('scan_sessions')
    .select('*, items!inner(user_id, item_name, item_category, qr_code, id)')
    .eq('items.user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message, sessions: [] },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sessions: data || [] });
}
