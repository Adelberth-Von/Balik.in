'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function logoutAction() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Supabase signOut error:', error);
  }
  
  // Force clear ALL cookies related to the app from the server side
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    allCookies.forEach((cookie) => {
      cookieStore.delete({
        name: cookie.name,
        path: '/',
        domain: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : undefined
      });
      // Try deleting without domain too
      cookieStore.delete(cookie.name);
    });
  } catch (e) {
    console.error('Cookie clear error:', e);
  }
  
  return { success: true };
}
