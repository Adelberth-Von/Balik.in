'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, QrCode, MessageSquare, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: ShoppingBag,
    emoji: '🛒',
    step: '01',
    title: 'Beli & Tempel',
    description: 'Beli paket stiker atau gantungan kunci QR Balik.In, tempelkan ke barang berhargamu. Setiap QR unik dan aktif selamanya.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: QrCode,
    emoji: '📱',
    step: '02',
    title: 'Penemu Scan QR',
    description: 'Saat barang ketinggalan, penemu cukup scan QR code dengan kamera HP biasa — tanpa perlu install aplikasi apapun.',
    color: 'from-secondary-500 to-secondary-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: MessageSquare,
    emoji: '💬',
    step: '03',
    title: 'Terhubung & Kembali',
    description: 'Kamu langsung dapat notifikasi, bisa chat anonim dengan penemu, dan lihat lokasi barangmu di peta secara real-time.',
    color: 'from-accent-500 to-accent-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-20 bg-white dark:bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-14"
        >
          <span className="text-zinc-500 font-semibold text-sm uppercase tracking-wider">Cara Kerja</span>
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white mt-2 mb-3">
            Semudah Scan, Secepat Chat
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            3 langkah mudah dari kehilangan barang hingga barang kembali ke tanganmu.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="flex justify-center mb-5 relative z-10">
                <div className="bg-white dark:bg-[#09090b] rounded-3xl">
                  <div className={`w-28 h-28 ${step.bg} rounded-3xl flex flex-col items-center justify-center shadow-sm`}>
                    <span className="text-4xl mb-1">{step.emoji}</span>
                    <span className={`text-xs font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                      LANGKAH {step.step}
                    </span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
