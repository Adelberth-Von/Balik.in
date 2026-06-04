import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
    session,
    messages: messages || [],
  });
}
