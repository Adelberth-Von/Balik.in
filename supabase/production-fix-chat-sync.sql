-- ============================================================
-- BALIK.IN - Production fix for public scan/chat sync
-- Run this in Supabase SQL Editor for the deployed project.
-- Safe to run more than once.
-- ============================================================

-- The app writes system messages when a scan session starts and when a
-- location/return confirmation is sent. Older schema versions rejected this.
ALTER TABLE IF EXISTS public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;

ALTER TABLE IF EXISTS public.chat_messages
  ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type IN ('text', 'location', 'system', 'image'));

-- Make sure anonymous finders can create/read chat sessions from public QR pages.
ALTER TABLE IF EXISTS public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_public_read_by_qr" ON public.items;
CREATE POLICY "items_public_read_by_qr" ON public.items
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "scan_sessions_public_insert" ON public.scan_sessions;
CREATE POLICY "scan_sessions_public_insert" ON public.scan_sessions
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "scan_sessions_public_read_by_token" ON public.scan_sessions;
CREATE POLICY "scan_sessions_public_read_by_token" ON public.scan_sessions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "scan_sessions_public_update" ON public.scan_sessions;
CREATE POLICY "scan_sessions_public_update" ON public.scan_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_public_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_public_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_public_read" ON public.chat_messages;
CREATE POLICY "chat_messages_public_read" ON public.chat_messages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "chat_messages_public_update" ON public.chat_messages;
CREATE POLICY "chat_messages_public_update" ON public.chat_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_items_qr_code ON public.items(qr_code);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_token ON public.scan_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

-- Supabase Realtime publication. Required for live chat/dashboard updates.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'chat_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'scan_sessions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_sessions;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END $$;
