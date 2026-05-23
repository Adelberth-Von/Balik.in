import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ProfilClient from './ProfilClient';

export const metadata = { title: 'Profil — Balik.In' };

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isDemoCookie = cookieStore.get('demo_mode')?.value === 'true';
  const isAdmin = user?.email === 'admin@balik.in';
  const isDemo = isDemoCookie || isAdmin;

  if (isDemo) {
    return <ProfilClient profile={{ id: 'demo123', full_name: 'Sobat Demo', email: 'demo@balik.in', phone_number: '08123456789' } as any} userId="demo123" />;
  }

  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  return <ProfilClient profile={profile} userId={user.id} />;
}
