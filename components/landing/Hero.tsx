'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Gamepad2, QrCode, ArrowRight, Sparkles, Shield, MapPin, MessageSquare, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-2rem)] items-center pt-16">
      {/* Minimalist Background Pattern */}
      <div className="absolute inset-0 bg-white dark:bg-zinc-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-zinc-400 dark:bg-zinc-800 opacity-20 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 px-4 py-1.5 rounded-full text-xs font-medium mb-6 shadow-sm">
                <Sparkles size={14} className="text-blue-500" />
                Dipercaya oleh 500+ Mahasiswa
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white leading-tight mb-6 tracking-tight"
            >
              Barang
              <br />
              Tertinggal?
              <br />
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                Balik.In Solusinya.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed max-w-lg"
            >
              Sistem pemulihan barang modern berbasis QR. Tanpa aplikasi tambahan. Penemu memindai, Anda langsung terhubung secara anonim. Aman, cepat, dan sangat efektif.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium px-6 py-3 rounded-full transition-all"
              >
                Mulai Sekarang <ArrowRight size={18} />
              </Link>
              <button
                onClick={() => {
                  document.cookie = "demo_mode=true; path=/";
                  window.location.href = '/dashboard';
                }}
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 font-medium px-6 py-3 rounded-full transition-all shadow-sm"
              >
                <Gamepad2 size={18} /> Coba Mode Demo
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-6"
            >
              {[
                { icon: Shield, text: 'Privasi Terjaga' },
                { icon: MapPin, text: 'Lokasi Akurat' },
                { icon: MessageSquare, text: 'Chat Anonim' },
                { icon: Zap, text: 'Notifikasi Instan' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  <item.icon size={16} className="text-zinc-400 dark:text-zinc-500" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className="flex justify-center"
          >
            <div className="relative scale-90 sm:scale-100">
              {/* Phone Frame */}
              <div className="w-72 bg-white dark:bg-zinc-950 rounded-[2rem] border-[8px] border-zinc-900 dark:border-zinc-800 p-2 shadow-2xl">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[1.5rem] overflow-hidden h-[460px] lg:h-[520px] border border-zinc-100 dark:border-zinc-800 relative">
                  {/* Status Bar */}
                  <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 text-center border-b border-zinc-200 dark:border-zinc-800 z-10 sticky top-0">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-white text-xs tracking-wide">Balik.In Secure</span>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="p-4 space-y-4">
                    {/* Category Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 text-center shadow-sm border border-zinc-100 dark:border-zinc-800">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <QrCode size={20} className="text-blue-500" />
                      </div>
                      <p className="font-bold text-zinc-900 dark:text-white text-lg">Ditemukan</p>
                      <p className="text-zinc-500 text-xs mt-1 font-medium">Kategori: Elektronik</p>
                    </div>

                    {/* Privacy badge */}
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
                      <Shield size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Identitas disamarkan demi keamanan</p>
                    </div>

                    {/* Location */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-medium text-zinc-500 mb-1.5">Lokasi Ditemukan</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Gedung B UAJY
                        </span>
                      </div>
                    </div>

                    {/* Send button */}
                    <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl py-3.5 text-center mt-6 font-medium text-sm shadow-md cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
                      Inisiasi Komunikasi
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 md:-right-12 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl shadow-lg border border-zinc-200/50 dark:border-zinc-800/50 p-3 w-48"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Pindaian Baru</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Aset Anda telah dipindai</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating chat bubble */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-6 -left-6 md:-left-12 z-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl rounded-tl-sm p-4 max-w-56 shadow-xl"
              >
                <p className="text-sm font-medium leading-relaxed">Terima kasih. Saya segera menuju lokasi.</p>
                <p className="text-[10px] text-zinc-400 mt-2 font-medium">14:32</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
