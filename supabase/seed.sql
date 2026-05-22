-- ============================================================
-- BALIK.IN — Seed Data (Demo)
-- Run AFTER schema.sql and rls-policies.sql
-- IMPORTANT: First create demo@balik.in user in Supabase Auth
-- dashboard with password demo1234, then get the UUID and
-- replace DEMO_USER_ID below.
-- ============================================================

-- NOTE: Replace these UUIDs after creating in Supabase Auth
-- Demo user auth UUID (create in Supabase Auth dashboard)
DO $$
DECLARE
  demo_user_id uuid;
  item1_id uuid;
  item2_id uuid;
  item3_id uuid;
  session1_id uuid;
  session2_id uuid;
BEGIN

-- Get or create demo user profile
-- First check if exists
SELECT id INTO demo_user_id FROM users WHERE email = 'demo@balik.in';

IF demo_user_id IS NULL THEN
  -- Insert demo user (id will be matched by auth trigger)
  -- You need to manually set this UUID after creating auth user
  demo_user_id := gen_random_uuid();
  INSERT INTO users (id, email, full_name, phone_number, whatsapp_number,
    preferred_contact, is_onboarded, total_items, total_scans, total_recovered)
  VALUES (
    demo_user_id,
    'demo@balik.in',
    'Dimas Pratama',
    '08123456789',
    '08123456789',
    'both',
    true,
    3,
    11,
    1
  );
END IF;

-- ============================================================
-- DEMO ITEMS
-- ============================================================

-- Check/insert Item 1: Charger Laptop
IF NOT EXISTS (SELECT 1 FROM items WHERE qr_code = 'BLJN-DEMO0001') THEN
  item1_id := gen_random_uuid();
  INSERT INTO items (id, user_id, item_name, item_description, item_category,
    qr_code, status, is_active, reward_offered, contact_preference, total_scans)
  VALUES (
    item1_id,
    demo_user_id,
    'Charger Laptop Dell',
    'Charger Dell 65W warna hitam, ada stiker nama di kabel',
    'elektronik',
    'BLJN-DEMO0001',
    'active',
    true,
    false,
    'both',
    3
  );
ELSE
  SELECT id INTO item1_id FROM items WHERE qr_code = 'BLJN-DEMO0001';
END IF;

-- Item 2: Botol Minum
IF NOT EXISTS (SELECT 1 FROM items WHERE qr_code = 'BLJN-DEMO0002') THEN
  item2_id := gen_random_uuid();
  INSERT INTO items (id, user_id, item_name, item_description, item_category,
    qr_code, status, is_active, reward_offered, reward_message, reward_amount,
    contact_preference, total_scans)
  VALUES (
    item2_id,
    demo_user_id,
    'Botol Minum Hijau Tupperware',
    'Botol 1 liter warna hijau tosca, ada gantungan kecil',
    'botol',
    'BLJN-DEMO0002',
    'lost',
    true,
    true,
    'Ada reward Rp 30.000 untuk yang menemukan!',
    30000,
    'both',
    1
  );
ELSE
  SELECT id INTO item2_id FROM items WHERE qr_code = 'BLJN-DEMO0002';
END IF;

-- Item 3: Tas Ransel
IF NOT EXISTS (SELECT 1 FROM items WHERE qr_code = 'BLJN-DEMO0003') THEN
  item3_id := gen_random_uuid();
  INSERT INTO items (id, user_id, item_name, item_description, item_category,
    qr_code, status, is_active, reward_offered, reward_message, reward_amount,
    contact_preference, total_scans)
  VALUES (
    item3_id,
    demo_user_id,
    'Tas Ransel Hitam Eiger',
    'Tas Eiger 30L warna hitam, ada patch bendera merah putih',
    'tas',
    'BLJN-DEMO0003',
    'returned',
    true,
    true,
    'Ada imbalan untuk yang menemukan',
    50000,
    'both',
    7
  );
ELSE
  SELECT id INTO item3_id FROM items WHERE qr_code = 'BLJN-DEMO0003';
END IF;

-- ============================================================
-- SCAN SESSIONS
-- ============================================================

-- Session for BLJN-DEMO0001
IF NOT EXISTS (SELECT 1 FROM scan_sessions WHERE session_token = 'demo-session-charger-001') THEN
  session1_id := gen_random_uuid();
  INSERT INTO scan_sessions (id, item_id, session_token, finder_latitude, finder_longitude,
    finder_location_name, finder_location_detail, initial_message, status, is_read_by_owner)
  VALUES (
    session1_id,
    item1_id,
    'demo-session-charger-001',
    -7.7734,
    110.3731,
    'Gedung B UAJY, Jl. Babarsari, Yogyakarta',
    'Perpustakaan lantai 2, meja dekat jendela',
    'Saya menemukan barang ini di meja perpustakaan lantai 2',
    'open',
    false
  );
ELSE
  SELECT id INTO session1_id FROM scan_sessions WHERE session_token = 'demo-session-charger-001';
END IF;

-- Session for BLJN-DEMO0002
IF NOT EXISTS (SELECT 1 FROM scan_sessions WHERE session_token = 'demo-session-botol-001') THEN
  session2_id := gen_random_uuid();
  INSERT INTO scan_sessions (id, item_id, session_token, finder_latitude, finder_longitude,
    finder_location_name, finder_location_detail, initial_message, status, is_read_by_owner)
  VALUES (
    session2_id,
    item2_id,
    'demo-session-botol-001',
    -7.7820,
    110.3670,
    'Kantin FTI UAJY, Yogyakarta',
    'Meja pojok kantin, dekat kasir',
    'Ketemu botol ini di kantin, ada yang punya?',
    'open',
    false
  );
ELSE
  SELECT id INTO session2_id FROM scan_sessions WHERE session_token = 'demo-session-botol-001';
END IF;

-- ============================================================
-- CHAT MESSAGES (for charger session)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM chat_messages WHERE session_id = session1_id LIMIT 1) THEN
  INSERT INTO chat_messages (session_id, sender_role, message_type, message, created_at)
  VALUES
    (session1_id, 'system', 'system', 'Sesi chat dimulai', now() - interval '2 hours'),
    (session1_id, 'finder', 'text', 'Halo, saya menemukan charger ini di perpustakaan. Masih ada di sini kok!', now() - interval '2 hours' + interval '1 minute'),
    (session1_id, 'owner', 'text', 'Wah makasih banget! Saya lagi di kampus, bisa tunggu 10 menit?', now() - interval '2 hours' + interval '3 minutes'),
    (session1_id, 'finder', 'text', 'Bisa, saya di meja dekat jendela lantai 2', now() - interval '2 hours' + interval '5 minutes'),
    (session1_id, 'finder', 'location', 'Lokasi saya sekarang', now() - interval '2 hours' + interval '5 minutes' + interval '30 seconds');
END IF;

-- ============================================================
-- NOTIFICATIONS (demo)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = demo_user_id LIMIT 1) THEN
  INSERT INTO notifications (user_id, type, title, body, session_id, item_id, is_read)
  VALUES
    (demo_user_id, 'new_scan', 'QR Dipindai!', 'Charger Laptop Dell kamu baru saja dipindai di Gedung B UAJY', session1_id, item1_id, false),
    (demo_user_id, 'new_message', 'Pesan Baru', 'Penemu charger kamu mengirim pesan baru', session1_id, item1_id, false),
    (demo_user_id, 'new_scan', 'QR Dipindai!', 'Botol Minum Hijau Tupperware kamu baru saja dipindai di Kantin FTI UAJY', session2_id, item2_id, false),
    (demo_user_id, 'item_returned', 'Barang Kembali! 🎉', 'Tas Ransel Hitam Eiger kamu telah berhasil kembali!', null, item3_id, true),
    (demo_user_id, 'system', 'Selamat Datang di Balik.In!', 'Akun demo kamu sudah siap. Jelajahi semua fitur Balik.In!', null, null, true);
END IF;

END $$;
