-- ============================================================
-- BALIK.IN — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE NOT NULL,
  full_name varchar NOT NULL,
  phone_number varchar NOT NULL,
  whatsapp_number varchar,
  avatar_url varchar,
  preferred_contact varchar DEFAULT 'chat'
    CHECK (preferred_contact IN ('chat', 'whatsapp', 'both')),
  language varchar DEFAULT 'id' CHECK (language IN ('id', 'en')),
  dark_mode boolean DEFAULT false,
  total_items integer DEFAULT 0,
  total_scans integer DEFAULT 0,
  total_recovered integer DEFAULT 0,
  is_onboarded boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================
-- ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  item_name varchar NOT NULL,
  item_description text,
  item_category varchar NOT NULL
    CHECK (item_category IN (
      'elektronik','tas','botol','kunci',
      'dompet','pakaian','buku','dokumen','lainnya'
    )),
  item_photo_url varchar,
  qr_code varchar UNIQUE NOT NULL,
  status varchar DEFAULT 'active'
    CHECK (status IN ('active','lost','found','returned','inactive')),
  is_active boolean DEFAULT true,
  reward_offered boolean DEFAULT false,
  reward_message text,
  reward_amount integer,
  contact_preference varchar DEFAULT 'chat'
    CHECK (contact_preference IN ('chat','whatsapp','both')),
  total_scans integer DEFAULT 0,
  last_scanned_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================
-- ITEM STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS item_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  old_status varchar,
  new_status varchar NOT NULL,
  changed_by varchar CHECK (changed_by IN ('owner','finder','system')),
  note text,
  created_at timestamp DEFAULT now()
);

-- ============================================================
-- SCAN SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id),
  session_token varchar UNIQUE NOT NULL,
  finder_latitude decimal(10,8),
  finder_longitude decimal(11,8),
  finder_location_name varchar,
  finder_location_detail varchar,
  finder_device varchar,
  initial_message text,
  status varchar DEFAULT 'open'
    CHECK (status IN ('open','closed','returned')),
  owner_confirmed_return boolean DEFAULT false,
  finder_confirmed_return boolean DEFAULT false,
  owner_rating integer CHECK (owner_rating BETWEEN 1 AND 5),
  finder_rating integer CHECK (finder_rating BETWEEN 1 AND 5),
  owner_feedback text,
  finder_feedback text,
  is_read_by_owner boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scan_sessions(id) ON DELETE CASCADE,
  sender_role varchar NOT NULL CHECK (sender_role IN ('system','owner','finder')),
  message_type varchar NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','location','image')),
  message text NOT NULL,
  location_lat decimal(10,8),
  location_lng decimal(11,8),
  location_name varchar,
  image_url text,
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- ============================================================
-- RLS POLICIES FOR PUBLIC ACCESS
-- ============================================================
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users (finders) to insert scan sessions
CREATE POLICY "Allow public insert to scan_sessions" 
  ON scan_sessions FOR INSERT TO public 
  WITH CHECK (true);

-- Allow anonymous users to view scan sessions they created (by token)
CREATE POLICY "Allow public select scan_sessions by token" 
  ON scan_sessions FOR SELECT TO public 
  USING (true);

-- Allow owners to view their item's sessions
CREATE POLICY "Allow owners to view scan_sessions" 
  ON scan_sessions FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM items WHERE items.id = scan_sessions.item_id AND items.user_id = auth.uid()));

-- Allow owners to update their item's sessions
CREATE POLICY "Allow owners to update scan_sessions" 
  ON scan_sessions FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM items WHERE items.id = scan_sessions.item_id AND items.user_id = auth.uid()));

-- Allow public insert to chat_messages
CREATE POLICY "Allow public insert to chat_messages" 
  ON chat_messages FOR INSERT TO public 
  WITH CHECK (true);

-- Allow public select chat_messages
CREATE POLICY "Allow public select chat_messages" 
  ON chat_messages FOR SELECT TO public 
  USING (true);

-- Allow system to insert notifications
CREATE POLICY "Allow public insert to notifications" 
  ON notifications FOR INSERT TO public 
  WITH CHECK (true);

-- Allow owners to view notifications
CREATE POLICY "Allow owners to view notifications" 
  ON notifications FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Allow owners to update notifications
CREATE POLICY "Allow owners to update notifications" 
  ON notifications FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type varchar NOT NULL
    CHECK (type IN (
      'new_scan','new_message','item_returned',
      'reward_claimed','status_changed','system'
    )),
  title varchar NOT NULL,
  body text NOT NULL,
  session_id uuid REFERENCES scan_sessions(id),
  item_id uuid REFERENCES items(id),
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- ============================================================
-- QR ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  package_type varchar NOT NULL
    CHECK (package_type IN ('stiker','gantungan','bundling')),
  quantity integer NOT NULL,
  unit_price integer NOT NULL,
  total_price integer NOT NULL,
  status varchar DEFAULT 'pending'
    CHECK (status IN ('pending','paid','processing','shipped','delivered')),
  created_at timestamp DEFAULT now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_qr_code ON items(qr_code);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_item_id ON scan_sessions(item_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_token ON scan_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scan_sessions_updated_at BEFORE UPDATE ON scan_sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auto-create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
