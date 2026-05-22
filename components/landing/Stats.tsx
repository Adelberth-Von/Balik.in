'use client';

import { motion } from 'framer-motion';

const STATS = [
  { value: '500+', label: 'Pengguna Aktif', emoji: '👥' },
  { value: '1.200+', label: 'Barang Terdaftar', emoji: '📦' },
  { value: '89%', label: 'Berhasil Kembali', emoji: '✅' },
  { value: '4.8/5', label: 'Rating Pengguna', emoji: '⭐' },
];

export default function Stats() {
  return (
    <section className="py-10 bg-white dark:bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center text-white"
            >
              <div className="text-3xl mb-1">{stat.emoji}</div>
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-blue-200 text-sm mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
