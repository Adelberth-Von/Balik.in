import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

let mockSessions: any[] = [];
let mockMessages: Record<string, any[]> = {};

const DEMO_EMAIL = 'demo@balik.in';

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

  if (token) {
    return Response.json(mockMessages[token] || []);
  }

  return Response.json(mockSessions);
}

export async function POST(req: Request) {
  const admin = createAdminSupabaseClient();
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
