import { createClient } from '@supabase/supabase-js';

export function createAdminSupabaseClient() {
  const runtimeEnv = process.env as Record<string, string | undefined>;
  const url = runtimeEnv['NEXT_PUBLIC_SUPABASE_URL'];
  const serviceRoleKey = runtimeEnv['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
