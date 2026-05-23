'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Grid, List, Package, QrCode, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Item, ItemCategory, ItemStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/types';
import { timeAgo } from '@/lib/utils/formatters';

const CATEGORIES: { value: ItemCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'tas', label: 'Tas' },
  { value: 'botol', label: 'Botol Minum' },
  { value: 'kunci', label: 'Kunci' },
  { value: 'dompet', label: 'Dompet' },
  { value: 'pakaian', label: 'Pakaian' },
  { value: 'buku', label: 'Buku' },
  { value: 'dokumen', label: 'Dokumen' },
  { value: 'lainnya', label: 'Lainnya' },
];

const STATUSES: { value: ItemStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'lost', label: 'Hilang' },
  { value: 'found', label: 'Ditemukan' },
  { value: 'returned', label: 'Kembali' },
  { value: 'inactive', label: 'Nonaktif' },
];

export default function ItemsClient({ items }: { items: Item[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [status, setStatus] = useState<ItemStatus | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6; // Set to 6 so it's easier to see pagination with dummy data

  const filtered = items.filter((item) => {
    const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || item.item_category === category;
    const matchStatus = status === 'all' || item.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCategory = (v: ItemCategory | 'all') => { setCategory(v); setPage(1); };
  const handleStatus = (v: ItemStatus | 'all') => { setStatus(v); setPage(1); };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Barang Saya</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{items.length} barang terdaftar</p>
        </div>
        <Link href="/barang/tambah" className="btn-primary !py-2 !px-4 flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Tambah Barang
        </Link>
      </div>

      {/* Filters */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all text-sm"
            placeholder="Cari barang..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => handleCategory(e.target.value as ItemCategory | 'all')}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => handleStatus(e.target.value as ItemStatus | 'all')}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2 transition-colors ${view === 'grid' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 transition-colors ${view === 'list' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Package size={24} className="text-zinc-500" />
          </div>
          <h3 className="font-semibold text-white mb-1">
            {items.length === 0 ? 'Belum ada barang terdaftar' : 'Tidak ada barang yang cocok'}
          </h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs">
            {items.length === 0
              ? 'Daftarkan barang pertamamu dan dapatkan QR code unik untuk proteksi ekstra.'
              : 'Coba ubah filter pencarian untuk menemukan barang yang dimaksud.'}
          </p>
          {items.length === 0 && (
            <Link href="/barang/tambah" className="btn-primary !py-2 !px-5 text-sm">
              + Daftarkan Barang Pertama
            </Link>
          )}
        </div>
        <>
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {paginatedItems.map((item, i) => (
              <ItemCard key={item.id} item={item} view={view} index={i} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-zinc-400 font-medium">Halaman {page} dari {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ItemCard({ item, view, index }: { item: Item; view: 'grid' | 'list'; index: number }) {
  const statusInfo = STATUS_CONFIG[item.status];

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-white truncate text-sm">{item.item_name}</p>
            <span className={statusInfo.className}>{statusInfo.label}</span>
          </div>
          <p className="text-xs font-mono text-zinc-500">{item.qr_code}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {item.total_scans}x dipindai · {item.last_scanned_at ? timeAgo(item.last_scanned_at) : 'Belum pernah'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/barang/${item.id}?tab=qr`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <QrCode size={13} /> QR
          </Link>
          <Link
            href={`/barang/${item.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Eye size={13} /> Detail
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Package className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="flex items-center gap-2">
          {item.status === 'lost' && (
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          )}
          <span className={statusInfo.className}>{statusInfo.label}</span>
        </div>
      </div>

      <h3 className="font-semibold text-white mb-1 leading-tight text-sm">{item.item_name}</h3>
      <p className="text-xs font-mono text-zinc-500 mb-3">{item.qr_code}</p>

      <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
        <span>{item.total_scans}x dipindai</span>
        <span>{item.last_scanned_at ? timeAgo(item.last_scanned_at) : 'Belum dipindai'}</span>
      </div>

      {item.reward_offered && (
        <div className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg mb-3">
          Ada hadiah untuk penemu
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/barang/${item.id}?tab=qr`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <QrCode size={13} /> QR Code
        </Link>
        <Link
          href={`/barang/${item.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-200 transition-colors"
        >
          <Eye size={13} /> Detail
        </Link>
      </div>
    </motion.div>
  );
}
