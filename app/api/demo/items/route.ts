import { NextResponse } from 'next/server';
import type { ContactPreference, ItemCategory } from '@/lib/types';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { DEMO_EMAIL } from '@/lib/demo/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEMO_ITEM_META_PREFIX = '__BALIK_DEMO_ITEM__:';
const DEMO_ITEM_SESSION_PREFIX = 'demo_item_';

const CATEGORIES: ItemCategory[] = [
  'elektronik',
  'tas',
  'botol',
  'kunci',
  'dompet',
  'pakaian',
  'buku',
  'dokumen',
  'lainnya',
];

const CONTACTS: ContactPreference[] = ['chat', 'whatsapp', 'both'];

function makeDemoQrCode() {
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `BLJN-DEMO${digits}`;
}

function makePrototypeQrCode() {
  return `BALIK-DEMO-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
}

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function demoItemSessionToken(qrCode: string) {
  return `${DEMO_ITEM_SESSION_PREFIX}${qrCode}`;
}

function encodeDemoItem(item: Record<string, unknown>) {
  return `${DEMO_ITEM_META_PREFIX}${JSON.stringify(item)}`;
}

function decodeDemoItem(detail?: string | null) {
  if (!detail?.startsWith(DEMO_ITEM_META_PREFIX)) return null;

  try {
    return JSON.parse(detail.slice(DEMO_ITEM_META_PREFIX.length));
  } catch {
    return null;
  }
}

async function getPublicStorageItem(client: ReturnType<typeof createPublicSupabaseClient>) {
  if (!client) return null;

  const { data: preferred } = await client
    .from('items')
    .select('id')
    .eq('qr_code', 'BLJN-DEMO0001')
    .maybeSingle();

  if (preferred) return preferred;

  const { data: fallback } = await client
    .from('items')
    .select('id')
    .like('qr_code', 'BLJN-DEMO%')
    .limit(1)
    .maybeSingle();

  return fallback;
}

async function getPublicDemoItem(qrCode: string) {
  const client = createPublicSupabaseClient();
  if (!client) return null;

  const { data } = await client
    .from('scan_sessions')
    .select('finder_location_detail')
    .eq('session_token', demoItemSessionToken(qrCode))
    .maybeSingle();

  return decodeDemoItem(data?.finder_location_detail);
}

async function savePublicDemoItem(item: Record<string, unknown>) {
  const client = createPublicSupabaseClient();
  const storageItem = await getPublicStorageItem(client);
  if (!client || !storageItem?.id) return false;

  const sessionToken = demoItemSessionToken(String(item.qr_code));
  const payload = {
    item_id: storageItem.id,
    session_token: sessionToken,
    finder_location_name: 'Demo item storage',
    finder_location_detail: encodeDemoItem(item),
    initial_message: String(item.item_name || 'Barang Demo'),
    status: 'closed',
    is_read_by_owner: true,
  };

  const { data: existing } = await client
    .from('scan_sessions')
    .select('id')
    .eq('session_token', sessionToken)
    .maybeSingle();

  const { error } = existing?.id
    ? await client.from('scan_sessions').update(payload).eq('session_token', sessionToken)
    : await client.from('scan_sessions').insert(payload);

  return !error;
}

async function getUniqueDemoQrCode(admin: ReturnType<typeof createAdminSupabaseClient>) {
  if (!admin) throw new Error('Supabase admin client tidak tersedia');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const qrCode = makeDemoQrCode();
    const { data } = await admin
      .from('items')
      .select('id')
      .eq('qr_code', qrCode)
      .maybeSingle();

    if (!data) return qrCode;
  }

  throw new Error('Gagal membuat QR demo unik');
}

export async function POST(req: Request) {
  const admin = createAdminSupabaseClient();
  const body = await req.json();
  const itemName = String(body.item_name || '').trim();
  const category = body.item_category as ItemCategory;
  const contactPreference = CONTACTS.includes(body.contact_preference)
    ? (body.contact_preference as ContactPreference)
    : 'chat';

  if (!itemName || !CATEGORIES.includes(category)) {
    return NextResponse.json(
      { ok: false, message: 'Nama dan kategori barang wajib diisi.' },
      { status: 400 }
    );
  }

  const rewardOffered = Boolean(body.reward_offered);
  const rewardAmount =
    rewardOffered && body.reward_amount !== null && body.reward_amount !== undefined && body.reward_amount !== ''
      ? Number(body.reward_amount)
      : null;

  if (!admin) {
    const now = new Date().toISOString();
    const qrCode = makePrototypeQrCode();
    const item = {
      id: `demo-item-${crypto.randomUUID()}`,
      user_id: 'demo123',
      item_name: itemName,
      item_category: category,
      item_description: body.item_description ? String(body.item_description) : null,
      qr_code: qrCode,
      status: 'active',
      is_active: body.is_active !== false,
      contact_preference: contactPreference,
      reward_offered: rewardOffered,
      reward_message: rewardOffered && body.reward_message ? String(body.reward_message) : null,
      reward_amount: Number.isFinite(rewardAmount) ? rewardAmount : null,
      total_scans: 0,
      created_at: now,
      updated_at: now,
    };

    const saved = await savePublicDemoItem(item);
    if (saved) {
      return NextResponse.json({ ok: true, item, persisted: 'supabase-public' });
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Demo database belum bisa menyimpan barang baru. Jalankan SQL public demo fallback atau set SUPABASE_SERVICE_ROLE_KEY.',
      },
      { status: 503 }
    );
  }

  let { data: demoUser, error: profileError } = await admin
    .from('users')
    .select('*')
    .eq('email', DEMO_EMAIL)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { ok: false, message: profileError.message },
      { status: 500 }
    );
  }

  if (!demoUser) {
    const { data: insertedUser, error: insertUserError } = await admin
      .from('users')
      .insert({
        email: DEMO_EMAIL,
        full_name: 'Dimas Pratama',
        phone_number: '08123456789',
        whatsapp_number: '08123456789',
        preferred_contact: 'both',
        is_onboarded: true,
      })
      .select()
      .single();

    if (insertUserError) {
      return NextResponse.json(
        { ok: false, message: insertUserError.message },
        { status: 500 }
      );
    }

    demoUser = insertedUser;
  }

  const qrCode = await getUniqueDemoQrCode(admin);

  const { data: item, error: itemError } = await admin
    .from('items')
    .insert({
      user_id: demoUser.id,
      item_name: itemName,
      item_category: category,
      item_description: body.item_description ? String(body.item_description) : null,
      qr_code: qrCode,
      status: 'active',
      is_active: body.is_active !== false,
      contact_preference: contactPreference,
      reward_offered: rewardOffered,
      reward_message: rewardOffered && body.reward_message ? String(body.reward_message) : null,
      reward_amount: Number.isFinite(rewardAmount) ? rewardAmount : null,
      total_scans: 0,
    })
    .select()
    .single();

  if (itemError) {
    return NextResponse.json(
      { ok: false, message: itemError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, item });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qrCode = searchParams.get('qr_code');

  if (!qrCode) {
    return NextResponse.json(
      { ok: false, message: 'QR code wajib diisi.' },
      { status: 400 }
    );
  }

  const admin = createAdminSupabaseClient();
  if (admin) {
    const { data } = await admin
      .from('items')
      .select('*')
      .eq('qr_code', qrCode)
      .maybeSingle();

    if (data) return NextResponse.json({ ok: true, item: data });
  }

  const item = await getPublicDemoItem(qrCode);
  if (item) return NextResponse.json({ ok: true, item });

  return NextResponse.json(
    { ok: false, message: 'Barang demo tidak ditemukan.' },
    { status: 404 }
  );
}
