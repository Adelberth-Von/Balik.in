import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'misconfigured',
        message: 'Environment Supabase belum lengkap di Vercel.',
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const startedAt = Date.now();
  const checks = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).limit(1),
    supabase.from('scan_sessions').select('id', { count: 'exact', head: true }).limit(1),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }).limit(1),
  ]);

  const failed = checks.find((result) => result.error);

  if (failed?.error) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'database-error',
        message: failed.error.message,
        elapsed_ms: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: 'supabase',
    message: 'Supabase tersambung dan tabel utama bisa diakses.',
    elapsed_ms: Date.now() - startedAt,
  });
}
