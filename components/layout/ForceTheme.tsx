'use client';

import { useEffect } from 'react';

export default function ForceTheme({ mode }: { mode: 'light' | 'dark' | 'auto' }) {
  useEffect(() => {
    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'auto') {
      const isDark = localStorage.getItem('darkMode') === 'true';
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [mode]);

  return null;
}
