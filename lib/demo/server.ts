import 'server-only';

import type { Item, Notification, ScanSession, User } from '@/lib/types';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const DEMO_EMAIL = 'demo@balik.in';

export const DEMO_FALLBACK_PROFILE: User = {
  id: 'demo123',
  email: DEMO_EMAIL,
  full_name: 'Sobat Demo',
  phone_number: '08123456789',
  whatsapp_number: '08123456789',
  preferred_contact: 'both',
  language: 'id',
  dark_mode: false,
  total_items: 3,
  total_scans: 11,
  total_recovered: 1,
  is_onboarded: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_FALLBACK_ITEMS: Item[] = [
  {
    id: '1',
    user_id: 'demo123',
    item_name: 'Charger Laptop Dell',
    item_description: 'Charger Dell 65W warna hitam, ada stiker nama di kabel',
    item_category: 'elektronik',
    qr_code: 'BLJN-DEMO0001',
    status: 'active',
    is_active: true,
    reward_offered: false,
    contact_preference: 'both',
    total_scans: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo123',
    item_name: 'Botol Minum Hijau Tupperware',
    item_description: 'Botol 1 liter warna hijau tosca, ada gantungan kecil',
    item_category: 'botol',
    qr_code: 'BLJN-DEMO0002',
    status: 'lost',
    is_active: true,
    reward_offered: true,
    reward_message: 'Ada reward Rp 30.000 untuk yang menemukan!',
    reward_amount: 30000,
    contact_preference: 'both',
    total_scans: 1,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    user_id: 'demo123',
    item_name: 'Tas Ransel Hitam Eiger',
    item_description: 'Tas Eiger 30L warna hitam, ada patch bendera merah putih',
    item_category: 'tas',
    qr_code: 'BLJN-DEMO0003',
    status: 'returned',
    is_active: true,
    reward_offered: true,
    reward_message: 'Ada imbalan untuk yang menemukan',
    reward_amount: 50000,
    contact_preference: 'both',
    total_scans: 7,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const DEMO_FALLBACK_SESSIONS: (ScanSession & { items?: Item })[] = [
  {
    id: 'demo-session-charger-001',
    item_id: '1',
    session_token: 'demo-session-charger-001',
    finder_latitude: -7.7734,
    finder_longitude: 110.3731,
    finder_location_name: 'Gedung B UAJY, Jl. Babarsari, Yogyakarta',
    finder_location_detail: 'Perpustakaan lantai 2, meja dekat jendela',
    initial_message: 'Saya menemukan barang ini di meja perpustakaan lantai 2',
    status: 'open',
    owner_confirmed_return: false,
    finder_confirmed_return: false,
    is_read_by_owner: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: DEMO_FALLBACK_ITEMS[0],
  },
];

const DEMO_FALLBACK_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-notification-1',
    user_id: 'demo123',
    type: 'new_scan',
    title: 'Barang Ditemukan!',
    body: 'Charger Laptop Dell telah dipindai di Gedung B UAJY.',
    is_read: false,
    created_at: new Date().toISOString(),
  },
];

export async function getDemoProfile() {
  const admin = createAdminSupabaseClient();
  if (!admin) return DEMO_FALLBACK_PROFILE;

  const { data } = await admin
    .from('users')
    .select('*')
    .eq('email', DEMO_EMAIL)
    .maybeSingle();

  return (data as User | null) || DEMO_FALLBACK_PROFILE;
}

export async function getDemoDashboardData() {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return {
      profile: DEMO_FALLBACK_PROFILE,
      items: DEMO_FALLBACK_ITEMS,
      sessions: DEMO_FALLBACK_SESSIONS,
      notifications: DEMO_FALLBACK_NOTIFICATIONS,
    };
  }

  const profile = await getDemoProfile();
  const [{ data: items }, { data: sessions }, { data: notifications }] = await Promise.all([
    admin
      .from('items')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    admin
      .from('scan_sessions')
      .select('*, items!inner(user_id, item_name, item_category, qr_code, id)')
      .eq('items.user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30),
    admin
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return {
    profile,
    items: (items?.length ? items : DEMO_FALLBACK_ITEMS) as Item[],
    sessions: (sessions?.length ? sessions : DEMO_FALLBACK_SESSIONS) as (ScanSession & { items?: Item })[],
    notifications: (notifications?.length ? notifications : DEMO_FALLBACK_NOTIFICATIONS) as Notification[],
  };
}

export async function getDemoItemDetail(id: string) {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    const item = DEMO_FALLBACK_ITEMS.find((candidate) => candidate.id === id);
    return { item: item || null, sessions: [] as ScanSession[] };
  }

  const profile = await getDemoProfile();
  const { data: item } = await admin
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!item) {
    const fallback = DEMO_FALLBACK_ITEMS.find((candidate) => candidate.id === id);
    return { item: fallback || null, sessions: [] as ScanSession[] };
  }

  const { data: sessions } = await admin
    .from('scan_sessions')
    .select('*')
    .eq('item_id', item.id)
    .order('created_at', { ascending: false });

  return { item: item as Item, sessions: (sessions || []) as ScanSession[] };
}
