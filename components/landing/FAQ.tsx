'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Bagaimana cara kerja QR code Balik.In?',
    a: 'Setiap QR code Balik.In unik dan terhubung ke akunmu. Saat seseorang menemukan barangmu dan scan QR, mereka akan dibawa ke halaman khusus di Balik.In. Di sana mereka bisa berbagi lokasi GPS dan mengirim pesan ke kamu secara anonim.',
  },
  {
    q: 'Apakah data pribadi saya aman?',
    a: 'Ya, 100% aman. Nama, nomor HP, email, dan semua data pribadimu tidak pernah ditampilkan ke penemu. Semua komunikasi berjalan melalui sistem chat anonim Balik.In.',
  },
  {
    q: 'Apakah penemu perlu install aplikasi?',
    a: 'Tidak! Penemu cukup scan QR dengan kamera HP biasa. Halaman scan langsung terbuka di browser tanpa perlu install aplikasi apapun. Sangat mudah!',
  },
  {
    q: 'Apa yang terjadi jika QR code rusak?',
    a: 'Kamu bisa download ulang QR code kapan saja dari dashboard Balik.In. QR yang sama bisa dicetak ulang dan ditempel ke barang yang sama. QR code dan seluruh data sesi chat tetap tersimpan.',
  },
  {
    q: 'Berapa lama QR code aktif?',
    a: 'QR code aktif selamanya selama akunmu aktif di Balik.In. Kamu bisa menonaktifkan QR tertentu kapan saja dari dashboard jika tidak diperlukan lagi.',
  },
  {
    q: 'Bagaimana cara memesan stiker/gantungan?',
    a: 'Daftar akun gratis di Balik.In, lalu pergi ke menu Produk. Pilih paket yang kamu inginkan dan ikuti proses pemesanan. Stiker akan dikirim ke alamatmu dalam 2-5 hari kerja.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-2 mb-3">Pertanyaan Umum</h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-slate-900 dark:text-white pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
