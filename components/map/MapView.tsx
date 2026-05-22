'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ScanSession, Item } from '@/lib/types';
import { CATEGORY_CONFIG } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/utils/formatters';

// Fix leaflet icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type SessionWithItem = ScanSession & { items: Item };

interface Props {
  sessions: SessionWithItem[];
  onSelectSession: (s: SessionWithItem | null) => void;
  selectedSession: SessionWithItem | null;
}

export default function MapView({ sessions, onSelectSession }: Props) {
  const router = useRouter();

  const validSessions = sessions.filter(
    (s) => s.finder_latitude && s.finder_longitude
  );

  // Default center: Yogyakarta
  const defaultCenter: [number, number] = [-7.7734, 110.3731];

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'open': return 'blue';
      case 'returned': return 'green';
      case 'closed': return 'gray';
      default: return 'blue';
    }
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validSessions.map((session) => {
        const catInfo = CATEGORY_CONFIG[session.items?.item_category];
        return (
          <Marker
            key={session.id}
            position={[session.finder_latitude!, session.finder_longitude!]}
            eventHandlers={{
              click: () => onSelectSession(session),
            }}
          >
            <Popup>
              <div className="min-w-48">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{catInfo?.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{catInfo?.label}</p>
                    <p className="text-xs text-gray-500">{timeAgo(session.created_at)}</p>
                  </div>
                </div>
                {session.finder_location_name && (
                  <p className="text-xs text-gray-600 mb-1">
                    📍 {session.finder_location_name}
                  </p>
                )}
                {session.initial_message && (
                  <p className="text-xs text-gray-600 mb-2 italic">
                    &ldquo;{session.initial_message.substring(0, 80)}{session.initial_message.length > 80 ? '...' : ''}&rdquo;
                  </p>
                )}
                <button
                  onClick={() => {
                    router.push(`/scan/${session.items?.qr_code}/chat/${session.session_token}`);
                  }}
                  className="w-full mt-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Buka Chat →
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
