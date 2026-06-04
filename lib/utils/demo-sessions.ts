import type { ChatMessage, Item, ScanSession } from '@/lib/types';

export type DemoSession = ScanSession & { items?: Item };

const DEMO_SESSIONS_KEY = 'baljn_demo_sessions';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readDemoSessions(): DemoSession[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(DEMO_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDemoSessions(sessions: DemoSession[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_SESSIONS_KEY, JSON.stringify(sessions));
}

export function saveDemoSession(session: DemoSession) {
  const sessions = readDemoSessions();
  const existingIndex = sessions.findIndex(
    (candidate) => candidate.session_token === session.session_token
  );

  if (existingIndex >= 0) sessions[existingIndex] = { ...sessions[existingIndex], ...session };
  else sessions.unshift(session);

  writeDemoSessions(sessions);
}

export function mergeDemoSessions<T extends DemoSession>(baseSessions: T[]) {
  const localSessions = readDemoSessions();
  if (localSessions.length === 0) return baseSessions;

  const merged = [...baseSessions] as DemoSession[];
  for (const session of localSessions) {
    const existingIndex = merged.findIndex(
      (candidate) => candidate.session_token === session.session_token
    );
    if (existingIndex >= 0) merged[existingIndex] = { ...merged[existingIndex], ...session };
    else merged.unshift(session);
  }

  return merged as T[];
}

export function demoChatKey(sessionToken: string) {
  return `baljn_demo_chat_${sessionToken}`;
}

export function readDemoMessages(sessionToken: string): ChatMessage[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(demoChatKey(sessionToken));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDemoMessages(sessionToken: string, messages: ChatMessage[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(demoChatKey(sessionToken), JSON.stringify(messages));
}

export function appendDemoMessage(sessionToken: string, message: ChatMessage) {
  const messages = readDemoMessages(sessionToken);
  if (messages.some((candidate) => candidate.id === message.id)) return;
  writeDemoMessages(sessionToken, [...messages, message]);
}

export function markDemoMessagesRead(sessionToken: string, role: 'owner' | 'finder') {
  const messages = readDemoMessages(sessionToken);
  if (messages.length === 0) return;

  writeDemoMessages(
    sessionToken,
    messages.map((message) =>
      message.sender_role !== role && message.sender_role !== 'system'
        ? { ...message, is_read: true }
        : message
    )
  );
}
