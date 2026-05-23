let mockSessions: any[] = [];
let mockMessages: Record<string, any[]> = {};

const defaultSession = {
  id: 's1',
  item_id: '2',
  session_token: 'tok_1',
  finder_location_name: 'Perpustakaan UAJY',
  status: 'open',
  is_read_by_owner: false,
  created_at: new Date().toISOString(),
  initial_message: 'Halo, saya menemukan barang ini.',
  items: {
    id: '2',
    user_id: 'demo123',
    item_name: 'Dompet Kulit',
    item_category: 'dompet',
    qr_code: 'BALIK-DEMO-2',
  },
};

function ensureDefaults() {
  if (!mockSessions.some((session) => session.session_token === 'tok_1')) {
    mockSessions.unshift(defaultSession);
  }

  if (!mockMessages.tok_1?.length) {
    mockMessages.tok_1 = [
      {
        id: 'm1',
        session_id: 'tok_1',
        sender_role: 'system',
        message_type: 'system',
        message: 'Sesi chat dimulai',
        is_read: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'm2',
        session_id: 'tok_1',
        sender_role: 'finder',
        message_type: 'text',
        message: 'Halo, saya menemukan barang ini.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function GET(req: Request) {
  ensureDefaults();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  if (token) {
    return Response.json(mockMessages[token] || []);
  }
  
  return Response.json(mockSessions);
}

export async function POST(req: Request) {
  ensureDefaults();
  const body = await req.json();
  const { type, payload } = body;

  if (type === 'CREATE_SESSION') {
    const existingIndex = mockSessions.findIndex(s => s.session_token === payload.session_token);
    if (existingIndex >= 0) {
      mockSessions[existingIndex] = payload;
    } else {
      mockSessions.push(payload);
    }
    return Response.json({ success: true });
  }

  if (type === 'ADD_MESSAGE') {
    const token = payload.session_id;
    if (!mockMessages[token]) mockMessages[token] = [];
    if (!mockMessages[token].some((message) => message.id === payload.id)) {
      mockMessages[token].push({ is_read: false, ...payload });
    }
    
    // Update initial_message in session preview
    const session = mockSessions.find(s => s.session_token === token);
    if (session && payload.sender_role === 'finder' && payload.message_type === 'text' && !session.initial_message) {
      session.initial_message = payload.message;
    }
    return Response.json({ success: true });
  }

  if (type === 'UPDATE_LOCATION') {
    const session = mockSessions.find(s => s.session_token === payload.session_token);
    if (session) {
      session.finder_latitude = payload.lat;
      session.finder_longitude = payload.lng;
      session.finder_location_name = payload.name;
    }
    return Response.json({ success: true });
  }

  if (type === 'MARK_READ') {
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
