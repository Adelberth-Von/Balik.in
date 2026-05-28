import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function checkRestTable(url: string, key: string, table: string) {
  const response = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (response.ok) return { ok: true, message: `${table} REST access ok.` };

  let message = `${table} REST access failed with ${response.status}.`;
  try {
    const body = await response.json();
    message = body.message || message;
  } catch {}

  return { ok: false, message };
}

export async function GET() {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const url = runtimeEnv['NEXT_PUBLIC_SUPABASE_URL'];
  const anonKey = runtimeEnv['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const serverKey = runtimeEnv['SUPABASE_SERVICE_ROLE_KEY'] || anonKey;

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
  const publicRestChecks = await Promise.all([
    checkRestTable(url, anonKey, 'items'),
    checkRestTable(url, anonKey, 'scan_sessions'),
    checkRestTable(url, anonKey, 'chat_messages'),
  ]);
  const publicRestFailed = publicRestChecks.find((result) => !result.ok);
  const failed = serverFailed || publicFailed || publicRestFailed;

  if (failed) {
    return NextResponse.json(
      {
        ok: false,
        mode: 'database-error',
        message: 'Supabase belum bisa diakses lengkap oleh browser/public client.',
        checks: {
          server: {
            ok: !serverFailed,
            message: serverFailed?.error?.message || 'Server/service access ok.',
          },
          public: {
            ok: !publicFailed && !publicRestFailed,
            message:
              publicFailed?.error?.message ||
              publicRestFailed?.message ||
              'Public anon access ok.',
            rest: publicRestChecks,
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
      public: { ok: true, message: 'Public anon access ok.', rest: publicRestChecks },
    },
    elapsed_ms: Date.now() - startedAt,
  });
}
