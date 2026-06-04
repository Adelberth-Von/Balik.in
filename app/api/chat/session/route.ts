import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DEMO_META_PREFIX = '__BALIK_DEMO_META__:';

function hydrateDemoSession(session: any) {
  const detail = session?.finder_location_detail;
  if (typeof detail !== 'string' || !detail.startsWith(DEMO_META_PREFIX)) return session;

  try {
    const itemMeta = JSON.parse(detail.slice(DEMO_META_PREFIX.length));
    return {
      ...session,
      finder_location_detail: null,
      items: {
        ...(session.items || {}),
        ...itemMeta,
      },
    };
  } catch {
    return session;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { ok: false, message: 'Token sesi wajib diisi.' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: session, error: sessionError } = await supabase
    .from('scan_sessions')
    .select('*, items(*)')
    .eq('session_token', token)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json(
      { ok: false, message: sessionError.message },
      { status: 500 }
    );
  }

  if (!session) {
    return NextResponse.json(
      { ok: false, message: 'Sesi tidak ditemukan.' },
      { status: 404 }
    );
  }

  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    return NextResponse.json(
      { ok: false, message: messagesError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: hydrateDemoSession(session),
    messages: messages || [],
  });
}
