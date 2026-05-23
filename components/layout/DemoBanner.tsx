'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Gamepad2, ArrowRight, DatabaseZap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 backdrop-blur-md"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 sm:flex">
              <DatabaseZap size={16} />
            </div>
            <span className="min-w-0">
              <strong className="inline-flex items-center gap-1 text-white">
                <Gamepad2 size={14} /> Mode Prototype
              </strong>{' '}
              <span className="text-amber-100/85">
                aktif. Data demo disimpan sementara di browser ini.
              </span>{' '}
              <Link
                href="/register"
                className="inline-flex items-center gap-1 font-semibold text-white underline-offset-4 hover:underline"
              >
                Daftar akun gratis <ArrowRight size={12} />
              </Link>
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-lg p-1 text-amber-100/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Tutup banner"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
