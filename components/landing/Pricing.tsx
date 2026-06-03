'use client';

import { motion } from 'framer-motion';
import { Check, KeyRound, Package, Tag } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Gratis',
    icon: Tag,
    price: 'Rp0',
    desc: 'Untuk mencoba fitur dasar Balik.In.',
    features: ['1 barang aktif', 'Generate 1 QR', 'Chat anonim dasar', 'Dashboard pengguna'],
    popular: false,
    badge: null,
    btnClass: 'btn-outline',
    cta: 'Mulai Gratis',
  },
  {
    name: 'Personal',
    icon: KeyRound,
    price: 'Rp25.000 / tahun',
    desc: 'Untuk pengguna pribadi yang ingin melindungi beberapa barang.',
    features: ['Hingga 5 barang aktif', 'Generate QR unik', 'Download QR PNG/PDF', 'Chat anonim', 'Riwayat scan', 'Notifikasi'],
    popular: true,
    badge: 'Paling Cocok',
    btnClass: 'btn-primary',
    cta: 'Pilih Personal',
  },
  {
    name: 'Pro',
    icon: Package,
    price: 'Rp50.000 / tahun',
    desc: 'Untuk pengguna yang membawa banyak barang dan butuh kontrol lebih.',
    features: ['Hingga 15 barang aktif', 'Custom label QR', 'Download template print', 'Riwayat scan lengkap', 'Prioritas notifikasi'],
    popular: false,
    badge: null,
    btnClass: 'btn-outline',
    cta: 'Pilih Pro',
  },
  {
    name: 'Organisasi',
    icon: Tag,
    price: 'Mulai Rp250.000 / bulan',
    desc: 'Untuk BEM, himpunan, lab, perpustakaan, sekolah, kampus, atau kantor.',
    features: ['Bulk generate QR', 'Dashboard admin', 'Banyak akun/barang', 'Export data', 'Manajemen barang temuan'],
    popular: false,
    badge: null,
    btnClass: 'btn-outline',
    cta: 'Hubungi Kami',
  },
];

export default function Pricing() {
  return (
    <section id="produk" className="py-20 bg-white dark:bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Produk</span>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-2 mb-3">Pilih Paket Akses</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">Pilih akses digital untuk membuat QR Balik.In sesuai kebutuhanmu.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-2xl relative bg-zinc-900 border transition-all ${
                plan.popular
                  ? 'border-white shadow-lg shadow-white/5 scale-105 z-10'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                  plan.popular
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-white'
                }`}>
                  {plan.badge}
                </div>
              )}

              <plan.icon size={34} className="mb-4 text-white" />
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-zinc-400 text-sm mb-6">{plan.desc}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {plan.price}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check size={16} className="text-white shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`${plan.btnClass} w-full flex items-center justify-center py-3 rounded-full font-semibold transition-all`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8 max-w-2xl mx-auto">
          Tidak mau repot print sendiri? Balik.In juga menyediakan layanan cetak opsional untuk stiker, label, dan gantungan QR siap pakai.
        </p>
      </div>
    </section>
  );
}
