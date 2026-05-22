'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Gamepad2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-primary-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Gamepad2 size={16} className="shrink-0" />
            <span className="truncate">
              <strong>Mode Demo Aktif</strong> — Data tidak tersimpan permanen.{' '}
              <Link
                href="/register"
                className="underline hover:no-underline inline-flex items-center gap-1 font-semibold"
              >
                Daftar akun gratis <ArrowRight size={12} />
              </Link>{' '}
              untuk penggunaan penuh.
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Tutup banner"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
