import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: id,
    });
  } catch {
    return 'baru saja';
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: id });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: id });
  } catch {
    return '-';
  }
}

export function formatTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'HH:mm', { locale: id });
  } catch {
    return '-';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function formatLongDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'EEEE, dd MMMM yyyy', { locale: id });
  } catch {
    return '-';
  }
}
