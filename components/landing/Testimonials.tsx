'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Rizki Ardian',
    role: 'Mahasiswa Teknik Informatika',
    university: 'UAJY Yogyakarta',
    avatar: 'R',
    rating: 5,
    quote: 'Charger laptop saya ketinggalan di perpustakaan. Berkat Balik.In, penemu langsung scan QR dan chat sama saya. Dalam 30 menit sudah kembali! 🎉',
    color: 'bg-blue-500',
  },
  {
    name: 'Aulia Rahmawati',
    role: 'Mahasiswi Manajemen',
    university: 'UGM Yogyakarta',
    avatar: 'A',
    rating: 5,
    quote: 'Dompetku hilang di kantin. Penemu scan QR di gantungan kunciku, kirim lokasi GPS, dan aku langsung ke sana. Privasi kami berdua terjaga banget!',
    color: 'bg-pink-500',
  },
  {
    name: 'Bima Setiawan',
    role: 'Mahasiswa Ilmu Komunikasi',
    university: 'UNY Yogyakarta',
    avatar: 'B',
    rating: 5,
    quote: 'Aplikasi ini wajib banget buat mahasiswa! Udah pasang stiker QR di tas, laptop bag, dan botol minum. Harga stiker juga terjangkau banget.',
    color: 'bg-green-500',
  },
];

export default function Testimonials() {
  return (
    <section id="testimoni" className="py-20 bg-slate-50 dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Testimoni</span>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-2 mb-3">
            Mereka Sudah Merasakan Manfaatnya
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 ${t.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                  <p className="text-xs text-primary-600">{t.university}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
