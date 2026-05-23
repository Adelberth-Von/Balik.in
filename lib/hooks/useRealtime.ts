'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage, Notification } from '@/lib/types';

type RealtimeCallback<T> = (payload: T) => void;

export function useChatRealtime(
  sessionId: string | null,
  onNewMessage: RealtimeCallback<ChatMessage>,
  onMessageUpdate?: RealtimeCallback<ChatMessage>
) {
  const supabase = createClient();
  const insertCallbackRef = useRef(onNewMessage);
  insertCallbackRef.current = onNewMessage;
  
  const updateCallbackRef = useRef(onMessageUpdate);
  updateCallbackRef.current = onMessageUpdate;

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          insertCallbackRef.current(payload.new as ChatMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (updateCallbackRef.current) {
            updateCallbackRef.current(payload.new as ChatMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);
}

export function useNotificationsRealtime(
  userId: string | null,
  onNewNotification: RealtimeCallback<Notification>
) {
  const supabase = createClient();
  const callbackRef = useRef(onNewNotification);
  callbackRef.current = onNewNotification;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);
}

export function useSessionsRealtime(
  itemIds: string[],
  onNewSession: RealtimeCallback<{ item_id: string }>
) {
  const supabase = createClient();
  const callbackRef = useRef(onNewSession);
  callbackRef.current = onNewSession;

  useEffect(() => {
    if (!itemIds.length) return;

    const channel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scan_sessions',
        },
        (payload) => {
          const session = payload.new as { item_id: string };
          if (itemIds.includes(session.item_id)) {
            callbackRef.current(session);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemIds.join(','), supabase]);
}

export function useMapRealtime(
  onLocationUpdate: RealtimeCallback<{ id: string; finder_latitude: number; finder_longitude: number; finder_location_name: string }>
) {
  const supabase = createClient();
  const callbackRef = useRef(onLocationUpdate);
  callbackRef.current = onLocationUpdate;

  useEffect(() => {
    const channel = supabase
      .channel('map-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scan_sessions',
        },
        (payload) => {
          const session = payload.new as { id: string; finder_latitude: number; finder_longitude: number; finder_location_name: string };
          if (session.finder_latitude && session.finder_longitude) {
            callbackRef.current(session);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
}
