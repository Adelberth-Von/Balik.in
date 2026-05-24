import {
  BookOpen,
  Briefcase,
  Droplet,
  FileText,
  KeyRound,
  Package,
  Shirt,
  WalletCards,
  Zap,
} from 'lucide-react';
import type { ItemCategory } from '@/lib/types';

const CATEGORY_ICONS = {
  elektronik: Zap,
  tas: Briefcase,
  botol: Droplet,
  kunci: KeyRound,
  dompet: WalletCards,
  pakaian: Shirt,
  buku: BookOpen,
  dokumen: FileText,
  lainnya: Package,
} satisfies Record<ItemCategory, typeof Package>;

export default function CategoryIcon({
  category,
  size = 24,
  className = '',
}: {
  category?: ItemCategory | null;
  size?: number;
  className?: string;
}) {
  const Icon = category ? CATEGORY_ICONS[category] : Package;
  return <Icon size={size} className={className} strokeWidth={2.25} />;
}
