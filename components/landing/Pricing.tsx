'use client';

import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Stiker QR',
    emoji: '🏷️',
    price: 25000,
    desc: '1 lembar isi 3 stiker QR unik',
    features: ['Tahan air', 'Mudah ditempel', 'QR aktif selamanya', 'Support chat anonim'],
    popular: false,
    badge: null,
    btnClass: 'btn-outline',
  },
  {
    name: 'Gantungan Kunci QR',
    emoji: '🔑',
    price: 20000,
    desc: '1 gantungan kunci dengan QR unik',
    features: ['Material ABS kuat', 'Cocok untuk tas & kunci', 'QR aktif selamanya', 'Desain premium'],
    popular: true,
    badge: '⭐ PALING LARIS',
    btnClass: 'btn-primary',
  },
  {
    name: 'Paket Bundling',
    emoji: '📦',
    price: 55000,
    originalPrice: 70000,
    desc: '2 lembar stiker + 1 gantungan kunci',
    features: ['Hemat Rp 15.000', 'Paling lengkap', 'Mix stiker & gantungan', 'Cocok untuk semua barang'],
    popular: false,
    badge: '💰 HEMAT',
    btnClass: 'btn-outline',
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
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-2 mb-3">Pilih Paket Pilihanmu</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">Harga terjangkau, perlindungan maksimal untuk barang berhargamu.</p>
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

              <div className="text-4xl mb-4">{plan.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-zinc-400 text-sm mb-6">{plan.desc}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    Rp {plan.price.toLocaleString('id-ID')}
                  </span>
                </div>
                {'originalPrice' in plan && plan.originalPrice && (
                  <span className="text-zinc-500 line-through text-sm">
                    Rp {plan.originalPrice.toLocaleString('id-ID')}
                  </span>
                )}
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
                Pesan Sekarang
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
