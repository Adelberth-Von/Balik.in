'use client';

import { motion } from 'framer-motion';
import { Shield, MapPin, MessageSquare, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: 'Privasi 100% Terjaga',
    description: 'Data pribadimu tidak pernah ditampilkan ke penemu. Komunikasi tetap anonim — pemilik dan penemu tidak tahu identitas satu sama lain.',
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    icon: MapPin,
    title: 'Lokasi GPS Akurat',
    description: 'Penemu bisa kirim lokasi GPS tepat di mana barang ditemukan. Tampil di peta real-time dengan detail alamat lengkap dari OpenStreetMap.',
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    icon: MessageSquare,
    title: 'Chat Anonim Real-time',
    description: 'Ngobrol langsung dengan penemu tanpa buka identitas, kapan saja sampai barang kembali. Seperti WhatsApp, tapi anonim sepenuhnya.',
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    icon: Zap,
    title: 'Notifikasi Instan',
    description: 'Langsung tahu detik itu juga saat QR barangmu dipindai oleh siapapun. Real-time via Supabase Realtime — tidak ada delay.',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Keunggulan</span>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-2 mb-3">
            Kenapa Pilih Balik.In?
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Dirancang khusus untuk keamanan dan kemudahan pengguna.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon size={26} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
