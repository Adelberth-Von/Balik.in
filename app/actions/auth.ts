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
  
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    for (const cookie of allCookies) {
      cookieStore.set(cookie.name, '', { maxAge: 0, path: '/' });
      cookieStore.delete(cookie.name);
    }
  } catch (e) {
    console.error('Cookie clear error:', e);
  }
  
  return { success: true };
}
