import { createBrowserClient } from '@supabase/ssr';

declare global {
  interface Window {
    __BALIK_SUPABASE__?: {
      url?: string;
      anonKey?: string;
    };
  }
}

export function createClient() {
  const runtimeConfig =
    typeof window !== 'undefined' ? window.__BALIK_SUPABASE__ : undefined;

  return createBrowserClient(
    runtimeConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    runtimeConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client components
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}
