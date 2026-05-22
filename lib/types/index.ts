export type ItemCategory =
  | 'elektronik'
  | 'tas'
  | 'botol'
  | 'kunci'
  | 'dompet'
  | 'pakaian'
  | 'buku'
  | 'dokumen'
  | 'lainnya';

export type ItemStatus = 'active' | 'lost' | 'found' | 'returned' | 'inactive';

export type ContactPreference = 'chat' | 'whatsapp' | 'both';

export type SessionStatus = 'open' | 'closed' | 'returned';

export type SenderRole = 'owner' | 'finder' | 'system';

export type MessageType = 'text' | 'location' | 'system' | 'image';

export type NotificationType =
  | 'new_scan'
  | 'new_message'
  | 'item_returned'
  | 'reward_claimed'
  | 'status_changed'
  | 'system';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  whatsapp_number?: string;
  avatar_url?: string;
  preferred_contact: ContactPreference;
  language: 'id' | 'en';
  dark_mode: boolean;
  total_items: number;
  total_scans: number;
  total_recovered: number;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  item_name: string;
  item_description?: string;
  item_category: ItemCategory;
  item_photo_url?: string;
  qr_code: string;
  status: ItemStatus;
  is_active: boolean;
  reward_offered: boolean;
  reward_message?: string;
  reward_amount?: number;
  contact_preference: ContactPreference;
  total_scans: number;
  last_scanned_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemStatusHistory {
  id: string;
  item_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: 'owner' | 'finder' | 'system';
  note?: string;
  created_at: string;
}

export interface ScanSession {
  id: string;
  item_id: string;
  session_token: string;
  finder_latitude?: number;
  finder_longitude?: number;
  finder_location_name?: string;
  finder_location_detail?: string;
  finder_device?: string;
  initial_message?: string;
  status: SessionStatus;
  owner_confirmed_return: boolean;
  finder_confirmed_return: boolean;
  owner_rating?: number;
  finder_rating?: number;
  owner_feedback?: string;
  finder_feedback?: string;
  is_read_by_owner: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  items?: Item;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_role: SenderRole;
  message_type: MessageType;
  message: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  session_id?: string;
  item_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface QrOrder {
  id: string;
  user_id: string;
  package_type: 'stiker' | 'gantungan' | 'bundling';
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered';
  created_at: string;
}

export const CATEGORY_CONFIG: Record<
  ItemCategory,
  { emoji: string; label: string; color: string }
> = {
  elektronik: { emoji: '🔌', label: 'Elektronik', color: 'bg-blue-100 text-blue-700' },
  tas: { emoji: '👜', label: 'Tas', color: 'bg-purple-100 text-purple-700' },
  botol: { emoji: '💧', label: 'Botol Minum', color: 'bg-cyan-100 text-cyan-700' },
  kunci: { emoji: '🔑', label: 'Kunci', color: 'bg-yellow-100 text-yellow-700' },
  dompet: { emoji: '👛', label: 'Dompet', color: 'bg-orange-100 text-orange-700' },
  pakaian: { emoji: '👕', label: 'Pakaian', color: 'bg-pink-100 text-pink-700' },
  buku: { emoji: '📚', label: 'Buku', color: 'bg-green-100 text-green-700' },
  dokumen: { emoji: '📄', label: 'Dokumen', color: 'bg-gray-100 text-gray-700' },
  lainnya: { emoji: '📦', label: 'Lainnya', color: 'bg-slate-100 text-slate-700' },
};

export const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; className: string }
> = {
  active: { label: 'Aktif', className: 'status-active' },
  lost: { label: 'Hilang', className: 'status-lost' },
  found: { label: 'Ditemukan', className: 'status-found' },
  returned: { label: 'Kembali', className: 'status-returned' },
  inactive: { label: 'Nonaktif', className: 'status-inactive' },
};
