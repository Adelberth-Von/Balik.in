'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  
  // Sign out from Supabase (this clears the session on the server)
  await supabase.auth.signOut();
  
  // Force clear ALL cookies related to the app from the server side
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  allCookies.forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });
  
  return { success: true };
}
