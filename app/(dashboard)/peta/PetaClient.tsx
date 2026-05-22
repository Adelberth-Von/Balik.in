'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Map, MapPin, Package, Clock } from 'lucide-react';
import type { ScanSession, Item } from '@/lib/types';
import { timeAgo } from '@/lib/utils/formatters';

const MapViewLeaflet = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#09090b' }}>
      <div className="text-center">
        <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Map size={22} className="text-zinc-500 animate-pulse" />
        </div>
        <p className="text-zinc-500 text-sm">Memuat peta...</p>
      </div>
    </div>
  ),
});

type SessionWithItem = ScanSession & { items: Item };

export default function PetaClient({ sessions }: { sessions: SessionWithItem[] }) {
  const [selectedSession, setSelectedSession] = useState<SessionWithItem | null>(null);
  const [localSessions, setLocalSessions] = useState<SessionWithItem[]>(sessions);
  const router = useRouter();

  useEffect(() => {
    setLocalSessions(sessions);
  }, [sessions]);

  // Real-time map updates
  useEffect(() => {
    const isDemo = sessions.some(s => s.items?.qr_code?.startsWith('BALIK-DEMO-'));
    if (!isDemo) {
      const interval = setInterval(() => router.refresh(), 5000);
      return () => clearInterval(interval);
    }

    // Demo Mode Sync
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/demo');
        const demoSessions = await res.json();
        if (demoSessions.length > 0) {
          setLocalSessions(prev => {
            const newSessions = [...prev];
            for (const ds of demoSessions) {
              const idx = newSessions.findIndex(s => s.session_token === ds.session_token);
              if (idx >= 0) newSessions[idx] = ds;
              else newSessions.unshift(ds);
            }
            return newSessions;
          });
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [sessions, router]);

  const locatedSessions = localSessions.filter(
    (s) => s.finder_latitude && s.finder_longitude
  );

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)', backgroundColor: '#09090b' }}>
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Peta Temuan</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {locatedSessions.length} lokasi tercatat
            </p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <MapPin size={13} className="text-blue-400" />
            <span className="text-sm font-medium text-white">{locatedSessions.length}</span>
            <span className="text-sm text-zinc-500">titik</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {locatedSessions.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center max-w-sm">
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin size={22} className="text-zinc-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Belum ada data lokasi</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Titik lokasi akan muncul ketika penemu berbagi posisi mereka saat scan QR code barang Anda.
              </p>
            </div>
          </div>
        ) : (
          <MapViewLeaflet
            sessions={locatedSessions}
            onSelectSession={setSelectedSession}
            selectedSession={selectedSession}
          />
        )}
      </div>

      {/* Selected Session Panel */}
      {selectedSession && (
        <div className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center shrink-0">
              <Package size={16} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">
                {(selectedSession as SessionWithItem).items?.item_name || 'Barang'}
              </p>
              <p className="text-xs text-zinc-500">{selectedSession.finder_location_name || 'Lokasi tidak diketahui'}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock size={11} />
              {timeAgo(selectedSession.created_at)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
