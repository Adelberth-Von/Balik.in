'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MapPin, ArrowLeft, CheckCircle2, Star, Loader2,
  Shield, X, Check, CheckCheck, ImagePlus, Camera
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_CONFIG } from '@/lib/types';
import type { ChatMessage, ScanSession, Item } from '@/lib/types';
import { useChatRealtime } from '@/lib/hooks/useRealtime';
import { formatTime } from '@/lib/utils/formatters';
import { reverseGeocode } from '@/lib/utils/geocoding';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import CategoryIcon from '@/components/ui/CategoryIcon';

const TinyMap = dynamic(() => import('@/components/chat/TinyMap'), { ssr: false });

const isDemoQr = (qrCode: string) => qrCode.startsWith('BALIK-DEMO-');

const createDemoItem = (qrCode: string) => {
  const demoId = qrCode.replace('BALIK-DEMO-', '');
  return {
    id: demoId,
    user_id: 'demo123',
    item_name: demoId === '1' ? 'MacBook Pro M2' : demoId === '2' ? 'Dompet Kulit' : 'Kunci Motor',
    item_category: demoId === '1' ? 'elektronik' : demoId === '2' ? 'dompet' : 'kunci',
    qr_code: qrCode,
    status: demoId === '1' ? 'active' : demoId === '2' ? 'lost' : 'returned',
  };
};

const normalizeDemoMessages = (messages: ChatMessage[]) =>
  messages.map((message) => ({
    ...message,
    is_read: Boolean(message.is_read),
  }));

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const qrCode = params.qr_code as string;
  const sessionToken = params.session_token as string;
  const supabase = createClient();

  const [session, setSession] = useState<ScanSession | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [demoChat, setDemoChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showConfirmReturn, setShowConfirmReturn] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [locationSending, setLocationSending] = useState(false);
  const [imageSending, setImageSending] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    init();
  }, [sessionToken]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadDemoChat = async () => {
    if (!isDemoQr(qrCode)) return false;

    const demoId = qrCode.replace('BALIK-DEMO-', '');
    const mockItemData = createDemoItem(qrCode);
    const mockSessionData = {
      id: 'mock-session-id',
      session_token: sessionToken,
      item_id: demoId,
      status: 'open',
      finder_location_name: 'Lokasi Demo',
      items: mockItemData,
    };

    setDemoChat(true);
    setSession(mockSessionData as any);
    setItem(mockItemData as any);
    setIsOwner(roleParam !== 'finder');

    // Try to load from server API for cross-browser Demo mode
    try {
      const res = await fetch(`/api/demo?token=${sessionToken}`);
      const savedChat = await res.json();
      if (savedChat && savedChat.length > 0) {
        setMessages(normalizeDemoMessages(savedChat));
        return true;
      }
    } catch {}

    // Fallback to local storage (legacy)
    const savedChatLocal = localStorage.getItem(`baljn_demo_chat_${sessionToken}`);
    if (savedChatLocal) {
      try {
        setMessages(normalizeDemoMessages(JSON.parse(savedChatLocal)));
        return true;
      } catch {}
    }

    setMessages([
      { id: 'm1', session_id: 'mock-session-id', sender_role: 'system', message_type: 'system', message: 'Sesi chat dimulai', is_read: true, created_at: new Date().toISOString() },
      { id: 'm2', session_id: 'mock-session-id', sender_role: 'finder', message_type: 'text', message: 'Halo, saya menemukan barang ini.', is_read: false, created_at: new Date().toISOString() }
    ] as any);

    return true;
  };

  const init = async () => {
    setLoading(true);
    setDemoChat(false);
    try {
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Koneksi Supabase terlalu lama')), 10000);
      });

      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);
      if (user) setCurrentUser({ id: user.id, email: user.email || '' });

      const { data: sessionData, error: sessionError } = await supabase
        .from('scan_sessions')
        .select('*, items(*)')
        .eq('session_token', sessionToken)
        .maybeSingle();

      if (sessionError) {
        console.error('Chat session query error:', sessionError);
      }

      if (!sessionData) {
        if (await loadDemoChat()) return;
        return;
      }

      setSession(sessionData);
      const itemData = sessionData.items as Item;
      setItem(itemData);
      setDemoChat(false);

      // Determine if viewer is owner
      if (user && itemData.user_id === user.id) {
        setIsOwner(true);
        // Mark as read
        await supabase
          .from('scan_sessions')
          .update({ is_read_by_owner: true })
          .eq('id', sessionData.id);
      }

      // Fetch messages
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);

      // Mark messages as read if owner
      if (user && itemData.user_id === user.id) {
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('session_id', sessionData.id)
          .eq('sender_role', 'finder');
      }
    } catch (error) {
      console.error('Chat init error:', error);
      if (await loadDemoChat()) return;
    } finally {
      setLoading(false);
    }
  };

  // Real-time new messages and updates
  useChatRealtime(
    session && !demoChat ? session.id : null,
    (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setIsTyping(false);
    },
    (updatedMsg) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    }
  );

  // LocalStorage sync for Demo Mode
  useEffect(() => {
    if (!demoChat) return;
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `baljn_demo_chat_${sessionToken}`) {
        if (e.newValue) {
          setMessages(normalizeDemoMessages(JSON.parse(e.newValue)));
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Auto-refresh chat for demo mode cross-browser sync
    const interval = setInterval(async () => {
      if (demoChat) {
        try {
          const res = await fetch(`/api/demo?token=${sessionToken}`);
          const parsed = await res.json();
          if (parsed) {
            const normalized = normalizeDemoMessages(parsed);
            setMessages((prev) => {
              const prevJson = JSON.stringify(prev);
              const nextJson = JSON.stringify(normalized);
              return prevJson === nextJson ? prev : normalized;
            });
          }
        } catch {}
      }
    }, 700);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [demoChat, sessionToken]);

  // Mark messages as read
  useEffect(() => {
    if (messages.length === 0 || !session) return;
    const myRole = isOwner ? 'owner' : 'finder';
    const unreadMessages = messages.filter(m => !m.is_read && m.sender_role !== myRole && m.sender_role !== 'system');
    
    if (unreadMessages.length > 0) {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_role !== myRole && m.sender_role !== 'system'
            ? { ...m, is_read: true }
            : m
        )
      );

      if (demoChat) {
        fetch('/api/demo', { method: 'POST', body: JSON.stringify({ type: 'MARK_READ', payload: { session_token: sessionToken, role: myRole } }) });
      } else {
        supabase.from('chat_messages').update({ is_read: true })
          .eq('session_id', session.id)
          .neq('sender_role', myRole)
          .neq('sender_role', 'system')
          .eq('is_read', false)
          .then();
      }
    }
  }, [messages, session, isOwner, sessionToken, demoChat, supabase]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const sendImage = async (file?: File) => {
    if (!file || !session || imageSending) return;
    setImageSending(true);

    const senderRole = isOwner ? 'owner' : 'finder';
    const optimisticId = 'optimistic-image-' + Date.now();

    try {
      let imageUrl = await fileToDataUrl(file);

      if (!demoChat) {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${session.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      const optimistic: ChatMessage = {
        id: optimisticId,
        session_id: session.id,
        sender_role: senderRole,
        message_type: 'image',
        message: 'Foto',
        image_url: imageUrl,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimistic]);

      const payload = {
        session_id: session.id,
        sender_role: senderRole,
        message_type: 'image',
        message: 'Foto',
        image_url: imageUrl,
      };

      if (demoChat) {
        await fetch('/api/demo', {
          method: 'POST',
          body: JSON.stringify({
            type: 'ADD_MESSAGE',
            payload: { ...payload, id: `m${Date.now()}`, session_id: sessionToken, created_at: new Date().toISOString() },
          }),
        });
      } else {
        const { data, error } = await supabase.from('chat_messages').insert(payload).select().single();
        if (error) throw error;
        setMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? data : msg)));
      }
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
      alert('Gagal mengirim foto');
    } finally {
      setImageSending(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    const senderRole = isOwner ? 'owner' : 'finder';

    // Optimistic update
    const optimistic: ChatMessage = {
      id: 'optimistic-' + Date.now(),
      session_id: session.id,
      sender_role: senderRole,
      message_type: 'text',
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    // DEMO MODE: Store in API
    if (demoChat) {
      const newMsg = {
        id: `m${Date.now()}`,
        session_id: sessionToken,
        sender_role: senderRole,
        message_type: 'text',
        message: text,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === optimistic.id ? newMsg as ChatMessage : msg))
      );
      fetch('/api/demo', {
        method: 'POST',
        body: JSON.stringify({ type: 'ADD_MESSAGE', payload: newMsg }),
      }).catch(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== newMsg.id));
        setNewMessage(text);
        alert('Gagal mengirim pesan');
      });

      setSending(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          sender_role: senderRole,
          message_type: 'text',
          message: text,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id.startsWith('optimistic-') ? data : m))
      );

      // Notify owner if finder sends
      if (!isOwner && item) {
        await supabase.from('notifications').insert({
          user_id: item.user_id,
          type: 'new_message',
          title: 'Pesan Baru',
          body: `Penemu barang kamu mengirim pesan: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
          session_id: session.id,
          item_id: item.id,
        });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('optimistic-')));
      alert('Gagal mengirim pesan');
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    if (!navigator.geolocation || !session) return;
    setLocationSending(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        const locationName = geo?.short_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        const locationMsg: any = {
          session_id: session.id,
          sender_role: isOwner ? 'owner' : 'finder',
          message_type: 'location',
          message: locationName,
          location_lat: lat,
          location_lng: lng,
          location_name: locationName,
        };

        const sysMsg: any = {
          session_id: session.id,
          sender_role: 'system',
          message_type: 'system',
          message: `${isOwner ? 'Pemilik' : 'Penemu'} berbagi lokasi baru`,
        };

        if (demoChat) {
          locationMsg.id = `m${Date.now()}`;
          locationMsg.created_at = new Date().toISOString();
          locationMsg.session_id = sessionToken;
          
          sysMsg.id = `m${Date.now() + 1}`;
          sysMsg.created_at = new Date().toISOString();
          sysMsg.session_id = sessionToken;

          await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ type: 'ADD_MESSAGE', payload: locationMsg }) });
          await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ type: 'ADD_MESSAGE', payload: sysMsg }) });
          
          if (!isOwner) {
            await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ type: 'UPDATE_LOCATION', payload: { session_token: sessionToken, lat, lng, name: locationName } }) });
          }

          const res = await fetch(`/api/demo?token=${sessionToken}`);
          setMessages(await res.json());
        } else {
          await supabase.from('chat_messages').insert(locationMsg);
          await supabase.from('chat_messages').insert(sysMsg);
          if (!isOwner) {
            await supabase.from('scan_sessions').update({
              finder_latitude: lat,
              finder_longitude: lng,
              finder_location_name: locationName
            }).eq('id', session.id);
          }
        }

        setLocationSending(false);
      },
      () => {
        alert('Tidak bisa mendapatkan lokasi');
        setLocationSending(false);
      }
    );
  };

  const handleConfirmReturn = async () => {
    if (!session) return;
    if (demoChat) {
      const systemMsg: ChatMessage = {
        id: `m-return-${Date.now()}`,
        session_id: sessionToken,
        sender_role: 'system',
        message_type: 'system',
        message: isOwner
          ? 'Pemilik mengkonfirmasi barang sudah kembali'
          : 'Penemu mengkonfirmasi barang sudah dikembalikan',
        is_read: true,
        created_at: new Date().toISOString(),
      };

      setSession((prev) => (prev ? { ...prev, status: 'returned' } : prev));
      setMessages((prev) => [...prev, systemMsg]);
      fetch('/api/demo', {
        method: 'POST',
        body: JSON.stringify({ type: 'ADD_MESSAGE', payload: systemMsg }),
      }).catch(() => {});
      setShowConfirmReturn(false);
      setShowRating(true);
      return;
    }

    const field = isOwner ? 'owner_confirmed_return' : 'finder_confirmed_return';
    await supabase.from('scan_sessions').update({ [field]: true }).eq('id', session.id);

    await supabase.from('chat_messages').insert({
      session_id: session.id,
      sender_role: 'system',
      message_type: 'system',
      message: isOwner
        ? 'Pemilik mengkonfirmasi barang sudah kembali'
        : 'Penemu mengkonfirmasi barang sudah dikembalikan',
    });

    if (isOwner && item) {
      await supabase.from('items').update({ status: 'returned' }).eq('id', item.id);
      await supabase
        .from('scan_sessions')
        .update({ status: 'returned' })
        .eq('id', session.id);
      await supabase.from('notifications').insert({
        user_id: item.user_id,
        type: 'item_returned',
        title: '🎉 Barang Berhasil Kembali!',
        body: `Barang kategori ${CATEGORY_CONFIG[item.item_category].label} kamu telah berhasil kembali!`,
        session_id: session.id,
        item_id: item.id,
      });
    }

    setShowConfirmReturn(false);
    setShowRating(true);
  };

  const handleRating = async () => {
    if (!session) return;
    if (demoChat) {
      toast.success('Rating prototype tersimpan.');
      setShowRating(false);
      return;
    }

    const field = isOwner ? 'owner_rating' : 'finder_rating';
    const feedbackField = isOwner ? 'owner_feedback' : 'finder_feedback';
    await supabase
      .from('scan_sessions')
      .update({ [field]: rating, [feedbackField]: feedback })
      .eq('id', session.id);
    setShowRating(false);
  };

  const categoryInfo = item ? CATEGORY_CONFIG[item.item_category] : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!session || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Sesi tidak ditemukan</h2>
          <button onClick={() => router.back()} className="btn-outline">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-900 flex flex-col max-w-2xl mx-auto overflow-hidden">
      {/* TOP BAR - MESSAGING APP STYLE */}
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3 shrink-0 z-20 shadow-sm border-b border-slate-100 dark:border-slate-700">
        {isOwner && (
          <button
            onClick={() => router.push('/pesan')}
            className="p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft size={22} className="text-slate-600 dark:text-slate-300" />
          </button>
        )}
        {!isOwner && (
          <button
            onClick={() => router.push('/')}
            className="p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Selesai / Tutup Chat"
          >
            <X size={22} className="text-slate-600 dark:text-slate-300" />
          </button>
        )}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary-500 to-blue-400 rounded-full flex items-center justify-center shadow-sm text-white">
            <CategoryIcon category={item.item_category} size={21} />
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
            session.status === 'open' ? 'bg-green-500' : 'bg-slate-400'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base leading-tight truncate">
            {isOwner ? 'Penemu Anonim' : 'Pemilik Barang'}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs truncate">
            {session.status === 'open' ? 'Sedang aktif' : 'Sesi selesai'} - {categoryInfo?.label}
          </div>
        </div>
      </div>

      {/* PRIVACY NOTICE */}
      <div className="bg-amber-50 dark:bg-amber-900/20 px-3 sm:px-4 py-2 flex justify-center items-center gap-2 text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs shadow-sm shrink-0 z-10">
        <Shield size={14} className="shrink-0" />
        <span className="text-center font-medium">Chat dilindungi enkripsi anonim. Identitas Anda aman.</span>
      </div>

      {/* MESSAGES */}
      <div className="scrollbar-stable flex-1 min-h-0 overflow-y-scroll px-3 sm:px-4 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isOwner={isOwner} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs">{isOwner ? 'Penemu' : 'Pemilik'} sedang mengetik...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* CONFIRM RETURN BUTTON */}
      {session.status === 'open' && isOwner && (
        <div className="px-3 sm:px-4 pb-2 shrink-0">
          <button
            onClick={() => setShowConfirmReturn(true)}
            className="w-full py-2.5 rounded-xl border-2 border-green-500 text-green-600 dark:text-green-400 text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            Konfirmasi Barang Sudah Kembali
          </button>
        </div>
      )}

      {/* INPUT BAR */}
      {session.status === 'open' && (
        <div className="p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => sendImage(e.target.files?.[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => sendImage(e.target.files?.[0])}
          />
          <div className="flex items-end gap-1.5 sm:gap-2 max-w-2xl mx-auto">
            <button
              onClick={sendLocation}
              disabled={locationSending}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-primary-600 hover:bg-primary-50 transition-colors shrink-0 flex items-center justify-center"
              title="Kirim lokasi GPS"
            >
              {locationSending ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={imageSending}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-primary-600 hover:bg-primary-50 transition-colors shrink-0 flex items-center justify-center"
              title="Kirim foto"
            >
              {imageSending ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={imageSending}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-primary-600 hover:bg-primary-50 transition-colors shrink-0 flex items-center justify-center"
              title="Buka kamera"
            >
              {imageSending ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            </button>
            <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm flex items-center px-3 sm:px-4 py-1 min-h-10 sm:min-h-[44px]">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2"
                placeholder="Ketik pesan..."
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white shadow-sm transition-colors shrink-0 flex items-center justify-center"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM RETURN MODAL */}
      <AnimatePresence>
        {showConfirmReturn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="card w-full max-w-sm p-6"
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <h3 className="font-bold text-lg">Konfirmasi Pengembalian</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {isOwner
                    ? 'Apakah barangmu sudah kembali ke tanganmu?'
                    : 'Apakah kamu sudah menyerahkan barang ini ke pemiliknya?'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmReturn(false)} className="flex-1 btn-ghost border border-slate-200">
                  Batal
                </button>
                <button onClick={handleConfirmReturn} className="flex-1 btn-secondary">
                  Ya, Sudah!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RATING MODAL */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="card w-full max-w-sm p-6"
            >
              <button onClick={() => setShowRating(false)} className="absolute top-4 right-4">
                <X size={20} className="text-slate-400" />
              </button>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="font-bold text-lg">Barang Berhasil Kembali!</h3>
                <p className="text-slate-500 text-sm mt-1">
                  {isOwner ? 'Beri rating untuk penemu yang baik ini' : 'Beri rating pengalamanmu dengan Balik.In'}
                </p>
              </div>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)}>
                    <Star
                      size={32}
                      className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-field resize-none mb-3"
                rows={3}
                placeholder="Tulis feedback (opsional)"
              />
              <button
                onClick={handleRating}
                disabled={rating === 0}
                className="w-full btn-primary disabled:opacity-50"
              >
                Kirim Rating
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ msg, isOwner }: { msg: ChatMessage; isOwner: boolean }) {
  if (msg.message_type === 'system') {
    return (
      <div className="text-center">
        <span className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {msg.message}
        </span>
      </div>
    );
  }

  if (msg.message_type === 'location' && msg.location_lat && msg.location_lng) {
    const isMyMessage = isOwner ? msg.sender_role === 'owner' : msg.sender_role === 'finder';
    return (
      <div className={`flex flex-col gap-1 ${isMyMessage ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] text-slate-400 px-1">
          {msg.sender_role === 'owner' ? 'Pemilik' : msg.sender_role === 'finder' ? (isOwner ? 'Penemu' : 'Penemu (Kamu)') : 'Sistem'}
        </span>
        <div className={`rounded-2xl overflow-hidden max-w-[220px] shadow-md border ${
          isMyMessage 
            ? 'rounded-tr-none border-[#C6F1A1] dark:border-[#004d3e]' 
            : 'rounded-tl-none border-slate-200 dark:border-slate-600'
        }`}>
          <TinyMap lat={msg.location_lat} lng={msg.location_lng} />
          <div className={`px-3 py-2 text-xs font-medium ${
            isMyMessage 
              ? 'bg-[#E1FFC7] dark:bg-[#005C4B] text-slate-900 dark:text-slate-100' 
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            <div className="flex items-center gap-1">
              <MapPin size={11} />
              <span className="truncate">{msg.location_name || 'Lokasi dibagikan'}</span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${msg.location_lat},${msg.location_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[10px] mt-0.5 underline ${isMyMessage ? 'text-blue-200' : 'text-primary-600'}`}
            >
              Buka di Maps
            </a>
          </div>
        </div>
        <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMyMessage ? 'text-slate-400' : 'text-slate-400'}`}>
          <span className="text-[10px] px-1">{formatTime(msg.created_at)}</span>
          {isMyMessage && (
            <span className="mr-1">
              {msg.is_read ? (
                <CheckCheck size={12} className="text-blue-500" />
              ) : (
                <CheckCheck size={12} className="text-slate-400 dark:text-slate-500" />
              )}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (msg.message_type === 'image' && msg.image_url) {
    const isMyMessage = isOwner ? msg.sender_role === 'owner' : msg.sender_role === 'finder';
    return (
      <div className={`flex flex-col gap-1 w-full ${isMyMessage ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[260px] overflow-hidden border shadow-md ${
          isMyMessage
            ? 'bg-[#E1FFC7] dark:bg-[#005C4B] rounded-2xl rounded-tr-none border-[#C6F1A1] dark:border-[#004d3e]'
            : 'bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none border-slate-200 dark:border-slate-700'
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.image_url} alt="Foto chat" className="block max-h-72 w-full object-cover" />
          <div className={`flex items-center justify-end gap-1 px-3 py-1.5 ${isMyMessage ? 'text-slate-500 dark:text-slate-300' : 'text-slate-400'}`}>
            <span className="text-[10px] font-medium">{formatTime(msg.created_at)}</span>
            {isMyMessage && (
              <span className="ml-0.5">
                {msg.is_read ? (
                  <CheckCheck size={14} className="text-blue-500" />
                ) : (
                  <CheckCheck size={14} className="text-slate-400 dark:text-slate-500" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isMyMessage = isOwner ? msg.sender_role === 'owner' : msg.sender_role === 'finder';

  return (
    <div className={`flex flex-col gap-1 w-full ${isMyMessage ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] px-4 py-2.5 relative shadow-md text-[15px] leading-relaxed border ${
        isMyMessage 
          ? 'bg-[#E1FFC7] dark:bg-[#005C4B] text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-none border-[#C6F1A1] dark:border-[#004d3e]' 
          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-none border-slate-200 dark:border-slate-700'
      }`}>
        <p className="break-words font-medium">{msg.message}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${isMyMessage ? 'text-slate-500 dark:text-slate-300' : 'text-slate-400'}`}>
          <span className="text-[10px] font-medium">{formatTime(msg.created_at)}</span>
          {isMyMessage && (
            <span className="ml-0.5">
              {msg.is_read ? (
                <CheckCheck size={14} className="text-blue-500" />
              ) : (
                <CheckCheck size={14} className="text-slate-400 dark:text-slate-500" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
