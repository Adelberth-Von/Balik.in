'use client';

import { useState, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  granted: boolean | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    granted: null,
  });

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        granted: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          granted: true,
        });
      },
      (err) => {
        let message = 'Gagal mendapatkan lokasi';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Akses lokasi ditolak';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Lokasi tidak tersedia';
        } else if (err.code === err.TIMEOUT) {
          message = 'Timeout mendapatkan lokasi';
        }
        setState(prev => ({
          ...prev,
          error: message,
          loading: false,
          granted: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, []);

  return { ...state, getCurrentPosition };
}
