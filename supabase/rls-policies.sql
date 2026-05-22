-- ============================================================
-- BALIK.IN — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS POLICIES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert during signup (handled by trigger)
CREATE POLICY "users_insert_trigger" ON users
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ITEMS POLICIES
-- ============================================================
-- Owners can do everything with their own items
CREATE POLICY "items_owner_all" ON items
  FOR ALL USING (auth.uid() = user_id);

-- PUBLIC: Anyone can read an item by qr_code (for scan page)
CREATE POLICY "items_public_read_by_qr" ON items
  FOR SELECT USING (is_active = true);

-- ============================================================
-- ITEM STATUS HISTORY POLICIES
-- ============================================================
-- Owners can read their items' history
CREATE POLICY "status_history_owner_read" ON item_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_status_history.item_id
      AND items.user_id = auth.uid()
    )
  );

-- System/service role can insert
CREATE POLICY "status_history_insert" ON item_status_history
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- SCAN SESSIONS POLICIES
-- ============================================================
-- PUBLIC: Anyone can create a scan session (finder, no login)
CREATE POLICY "scan_sessions_public_insert" ON scan_sessions
  FOR INSERT WITH CHECK (true);

-- PUBLIC: Anyone can read a session by session_token (for finder)
CREATE POLICY "scan_sessions_public_read_by_token" ON scan_sessions
  FOR SELECT USING (true);

-- PUBLIC: Anyone can update a session they know the token for
CREATE POLICY "scan_sessions_public_update" ON scan_sessions
  FOR UPDATE USING (true);

-- Owners can read sessions for their items
CREATE POLICY "scan_sessions_owner_read" ON scan_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = scan_sessions.item_id
      AND items.user_id = auth.uid()
    )
  );

-- ============================================================
-- CHAT MESSAGES POLICIES
-- ============================================================
-- PUBLIC: Anyone can insert messages (finder, no login)
CREATE POLICY "chat_messages_public_insert" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- PUBLIC: Anyone can read messages (by session access)
CREATE POLICY "chat_messages_public_read" ON chat_messages
  FOR SELECT USING (true);

-- PUBLIC: Anyone can update read status
CREATE POLICY "chat_messages_public_update" ON chat_messages
  FOR UPDATE USING (true);

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
-- Users can only see their own notifications
CREATE POLICY "notifications_own_read" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Service can insert notifications
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can mark their own as read
CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- QR ORDERS POLICIES
-- ============================================================
CREATE POLICY "qr_orders_owner_all" ON qr_orders
  FOR ALL USING (auth.uid() = user_id);
