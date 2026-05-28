import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

  if (!url || !anonKey || !serverKey) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'misconfigured',
        message: 'Environment Supabase belum lengkap di Vercel.',
      },
      { status: 500 }
    );
  }

  const serverClient = createClient(url, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const publicClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const startedAt = Date.now();
  const serverChecks = await Promise.all([
    serverClient.from('items').select('id', { count: 'exact', head: true }).limit(1),
    serverClient.from('scan_sessions').select('id', { count: 'exact', head: true }).limit(1),
    serverClient.from('chat_messages').select('id', { count: 'exact', head: true }).limit(1),
  ]);
  const publicChecks = await Promise.all([
    publicClient.from('items').select('id', { count: 'exact', head: true }).limit(1),
    publicClient.from('scan_sessions').select('id', { count: 'exact', head: true }).limit(1),
    publicClient.from('chat_messages').select('id', { count: 'exact', head: true }).limit(1),
  ]);

  const serverFailed = serverChecks.find((result) => result.error);
  const publicFailed = publicChecks.find((result) => result.error);
  const failed = serverFailed || publicFailed;

  if (failed?.error) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'database-error',
        message: failed.error.message,
        checks: {
          server: {
            ok: !serverFailed,
            message: serverFailed?.error?.message || 'Server/service access ok.',
          },
          public: {
            ok: !publicFailed,
            message: publicFailed?.error?.message || 'Public anon access ok.',
          },
        },
        elapsed_ms: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: 'supabase',
    message: 'Supabase tersambung dan tabel utama bisa diakses oleh server serta public anon client.',
    checks: {
      server: { ok: true, message: 'Server/service access ok.' },
      public: { ok: true, message: 'Public anon access ok.' },
    },
    elapsed_ms: Date.now() - startedAt,
  });
}
