let mockSessions: any[] = [];
let mockMessages: Record<string, any[]> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  if (token) {
    return Response.json(mockMessages[token] || []);
  }
  
  return Response.json(mockSessions);
}

export async function POST(req: Request) {
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
    mockMessages[token].push(payload);
    
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
