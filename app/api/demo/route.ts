import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

let mockSessions: any[] = [];
let mockMessages: Record<string, any[]> = {};

const DEMO_EMAIL = 'demo@balik.in';
const DEMO_META_PREFIX = '__BALIK_DEMO_META__:';

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

function encodeDemoMeta(item: any) {
  if (!item) return null;
  return `${DEMO_META_PREFIX}${JSON.stringify(item)}`;
}

function hydrateDemoSession(session: any) {
  const detail = session?.finder_location_detail;
  if (typeof detail !== 'string' || !detail.startsWith(DEMO_META_PREFIX)) return session;

  try {
    const itemMeta = JSON.parse(detail.slice(DEMO_META_PREFIX.length));
    return {
      ...session,
      finder_location_detail: null,
      items: {
        ...(session.items || {}),
        ...itemMeta,
      },
    };
  } catch {
    return session;
  }
}

async function getDemoUserId(admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>) {
  const { data } = await admin
    .from('users')
    .select('id')
    .eq('email', DEMO_EMAIL)
    .maybeSingle();

  return data?.id as string | undefined;
}

async function getDbSessionByToken(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  token: string
) {
  const { data } = await admin
    .from('scan_sessions')
    .select('*, items(*)')
    .eq('session_token', token)
    .maybeSingle();

  return data;
}

async function getPublicSessionByToken(client: ReturnType<typeof createPublicSupabaseClient>, token: string) {
  if (!client) return null;

  const { data } = await client
    .from('scan_sessions')
    .select('*, items(*)')
    .eq('session_token', token)
    .maybeSingle();

  return data ? hydrateDemoSession(data) : null;
}

async function getDemoStorageItem(client: ReturnType<typeof createPublicSupabaseClient>, payload: any) {
  if (!client) return null;

  const preferredQr = payload?.items?.qr_code;
  if (preferredQr) {
    const { data } = await client
      .from('items')
      .select('*')
      .eq('qr_code', preferredQr)
      .maybeSingle();

    if (data) return data;
  }

  const { data: fallback } = await client
    .from('items')
    .select('*')
    .eq('qr_code', 'BLJN-DEMO0001')
    .maybeSingle();

  if (fallback) return fallback;

  const { data: firstDemo } = await client
    .from('items')
    .select('*')
    .like('qr_code', 'BLJN-DEMO%')
    .limit(1)
    .maybeSingle();

  return firstDemo;
}

async function upsertPublicDemoSession(client: ReturnType<typeof createPublicSupabaseClient>, payload: any) {
  if (!client || !payload?.session_token) return null;

  const storageItem = await getDemoStorageItem(client, payload);
  if (!storageItem?.id) return null;

  const dbPayload = {
    item_id: storageItem.id,
    session_token: payload.session_token,
    finder_latitude: payload.finder_latitude || null,
    finder_longitude: payload.finder_longitude || null,
    finder_location_name: payload.finder_location_name || null,
    finder_location_detail: encodeDemoMeta(payload.items) || payload.finder_location_detail || null,
    initial_message: payload.initial_message || null,
    status: payload.status || 'open',
    is_read_by_owner: Boolean(payload.is_read_by_owner),
  };

  const existing = await getPublicSessionByToken(client, payload.session_token);
  const query = existing?.id
    ? client.from('scan_sessions').update(dbPayload).eq('session_token', payload.session_token)
    : client.from('scan_sessions').insert(dbPayload);

  const { data, error } = await query.select('*, items(*)').single();
  if (error || !data) return null;

  return hydrateDemoSession(data);
}

async function addPublicDemoMessage(client: ReturnType<typeof createPublicSupabaseClient>, payload: any) {
  if (!client) return null;

  let dbSession = await getPublicSessionByToken(client, payload.session_id);
  if (!dbSession && payload.session?.session_token) {
    dbSession = await upsertPublicDemoSession(client, payload.session);
  }
  if (!dbSession?.id) return null;

  const messagePayload = {
    session_id: dbSession.id,
    sender_role: payload.sender_role,
    message_type: payload.message_type || 'text',
    message: payload.message,
    location_lat: payload.location_lat || null,
    location_lng: payload.location_lng || null,
    location_name: payload.location_name || null,
    image_url: payload.image_url || null,
    is_read: Boolean(payload.is_read),
  };

  const { data, error } = await client
    .from('chat_messages')
    .insert(messagePayload)
    .select()
    .single();

  if (error || !data) return null;

  if (payload.sender_role === 'finder' && payload.message_type === 'text') {
    await client
      .from('scan_sessions')
      .update({ initial_message: payload.message, is_read_by_owner: false })
      .eq('id', dbSession.id);
  }

  return data;
}

function writeMemorySession(payload: any) {
  if (!payload?.session_token) return;
  const existingIndex = mockSessions.findIndex(s => s.session_token === payload.session_token);
  if (existingIndex >= 0) mockSessions[existingIndex] = payload;
  else mockSessions.push(payload);
}

function writeMemoryMessage(payload: any) {
  if (payload.session?.session_token) {
    writeMemorySession(payload.session);
  }

  const token = payload.session_id;
  if (!mockMessages[token]) mockMessages[token] = [];
  if (!mockMessages[token].some((message) => message.id === payload.id)) {
    const { session: _session, ...messagePayload } = payload;
    mockMessages[token].push({ is_read: false, ...messagePayload });
  }

  const session = mockSessions.find(s => s.session_token === token);
  if (session && payload.sender_role === 'finder' && payload.message_type === 'text' && !session.initial_message) {
    session.initial_message = payload.message;
  }
}

export async function GET(req: Request) {
  const admin = createAdminSupabaseClient();
  const publicClient = createPublicSupabaseClient();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (admin && token) {
    const dbSession = await getDbSessionByToken(admin, token);
    if (dbSession?.id) {
      const { data } = await admin
        .from('chat_messages')
        .select('*')
        .eq('session_id', dbSession.id)
        .order('created_at', { ascending: true });

      return Response.json(data || []);
    }
  }

  if (admin && !token) {
    const demoUserId = await getDemoUserId(admin);
    if (demoUserId) {
      const { data } = await admin
        .from('scan_sessions')
        .select('*, items!inner(*)')
        .eq('items.user_id', demoUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      return Response.json(data || []);
    }
  }

  if (publicClient && token) {
    const dbSession = await getPublicSessionByToken(publicClient, token);
    if (dbSession?.id) {
      const { data } = await publicClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', dbSession.id)
        .order('created_at', { ascending: true });

      return Response.json(data || []);
    }
  }

  if (publicClient && !token) {
    const { data } = await publicClient
      .from('scan_sessions')
      .select('*, items(*)')
      .like('session_token', 'demo%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data?.length) return Response.json(data.map(hydrateDemoSession));
  }

  if (token) {
    return Response.json(mockMessages[token] || []);
  }

  return Response.json(mockSessions);
}

export async function POST(req: Request) {
  const admin = createAdminSupabaseClient();
  const publicClient = createPublicSupabaseClient();
  const body = await req.json();
  const { type, payload } = body;

  if (type === 'CREATE_SESSION') {
    if (admin) {
      const dbPayload = {
        item_id: payload.item_id,
        session_token: payload.session_token,
        finder_latitude: payload.finder_latitude || null,
        finder_longitude: payload.finder_longitude || null,
        finder_location_name: payload.finder_location_name || null,
        finder_location_detail: payload.finder_location_detail || null,
        initial_message: payload.initial_message || null,
        status: payload.status || 'open',
        is_read_by_owner: Boolean(payload.is_read_by_owner),
      };

      const existing = await getDbSessionByToken(admin, payload.session_token);
      const query = existing?.id
        ? admin.from('scan_sessions').update(dbPayload).eq('session_token', payload.session_token)
        : admin.from('scan_sessions').insert(dbPayload);

      const { data, error } = await query.select('*, items(*)').single();
      if (!error) {
        return Response.json({ success: true, persisted: 'supabase', session: data });
      }
    }

    const publicSession = await upsertPublicDemoSession(publicClient, payload);
    if (publicSession) {
      return Response.json({ success: true, persisted: 'supabase-public', session: publicSession });
    }

    writeMemorySession(payload);
    return Response.json({ success: true });
  }

  if (type === 'ADD_MESSAGE') {
    if (payload.session?.session_token) {
      writeMemorySession(payload.session);
    }

    if (admin) {
      const dbSession = await getDbSessionByToken(admin, payload.session_id);
      if (dbSession?.id) {
        const messagePayload = {
          session_id: dbSession.id,
          sender_role: payload.sender_role,
          message_type: payload.message_type || 'text',
          message: payload.message,
          location_lat: payload.location_lat || null,
          location_lng: payload.location_lng || null,
          location_name: payload.location_name || null,
          image_url: payload.image_url || null,
          is_read: Boolean(payload.is_read),
        };

        const { data, error } = await admin
          .from('chat_messages')
          .insert(messagePayload)
          .select()
          .single();

        if (!error) {
          if (payload.sender_role === 'finder' && payload.message_type === 'text') {
            await admin
              .from('scan_sessions')
              .update({ initial_message: payload.message, is_read_by_owner: false })
              .eq('id', dbSession.id);
          }

          return Response.json({ success: true, persisted: 'supabase', message: data });
        }
      }
    }

    const publicMessage = await addPublicDemoMessage(publicClient, payload);
    if (publicMessage) {
      return Response.json({ success: true, persisted: 'supabase-public', message: publicMessage });
    }

    writeMemoryMessage(payload);
    return Response.json({ success: true });
  }

  if (type === 'UPDATE_LOCATION') {
    if (admin) {
      const { error } = await admin
        .from('scan_sessions')
        .update({
          finder_latitude: payload.lat,
          finder_longitude: payload.lng,
          finder_location_name: payload.name,
        })
        .eq('session_token', payload.session_token);

      if (!error) return Response.json({ success: true, persisted: 'supabase' });
    }

    if (publicClient) {
      const { error } = await publicClient
        .from('scan_sessions')
        .update({
          finder_latitude: payload.lat,
          finder_longitude: payload.lng,
          finder_location_name: payload.name,
        })
        .eq('session_token', payload.session_token);

      if (!error) return Response.json({ success: true, persisted: 'supabase-public' });
    }

    const session = mockSessions.find(s => s.session_token === payload.session_token);
    if (session) {
      session.finder_latitude = payload.lat;
      session.finder_longitude = payload.lng;
      session.finder_location_name = payload.name;
    }

    return Response.json({ success: true });
  }

  if (type === 'MARK_READ') {
    if (admin) {
      const dbSession = await getDbSessionByToken(admin, payload.session_token);
      if (dbSession?.id) {
        await admin
          .from('chat_messages')
          .update({ is_read: true })
          .eq('session_id', dbSession.id)
          .neq('sender_role', payload.role)
          .neq('sender_role', 'system');

        if (payload.role === 'owner') {
          await admin
            .from('scan_sessions')
            .update({ is_read_by_owner: true })
            .eq('id', dbSession.id);
        }

        return Response.json({ success: true, persisted: 'supabase' });
      }
    }

    if (publicClient) {
      const dbSession = await getPublicSessionByToken(publicClient, payload.session_token);
      if (dbSession?.id) {
        await publicClient
          .from('chat_messages')
          .update({ is_read: true })
          .eq('session_id', dbSession.id)
          .neq('sender_role', payload.role)
          .neq('sender_role', 'system');

        if (payload.role === 'owner') {
          await publicClient
            .from('scan_sessions')
            .update({ is_read_by_owner: true })
            .eq('id', dbSession.id);
        }

        return Response.json({ success: true, persisted: 'supabase-public' });
      }
    }

    const messages = mockMessages[payload.session_token] || [];
    for (const msg of messages) {
      if (msg.sender_role !== payload.role && msg.sender_role !== 'system') {
        msg.is_read = true;
      }
    }
    // Also mark session as read if owner
    if (payload.role === 'owner') {
      const session = mockSessions.find(s => s.session_token === payload.session_token);
      if (session) session.is_read_by_owner = true;
    }
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid type' }, { status: 400 });
}
