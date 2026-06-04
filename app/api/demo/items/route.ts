import { NextResponse } from 'next/server';
import type { ContactPreference, ItemCategory } from '@/lib/types';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { DEMO_EMAIL } from '@/lib/demo/server';

export const dynamic = 'force-dynamic';

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

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        message: 'SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel, jadi demo database belum bisa menyimpan barang baru.',
      },
      { status: 503 }
    );
  }

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
  const rewardOffered = Boolean(body.reward_offered);
  const rewardAmount =
    rewardOffered && body.reward_amount !== null && body.reward_amount !== undefined && body.reward_amount !== ''
      ? Number(body.reward_amount)
      : null;

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
