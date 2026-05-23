'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, QrCode, LogIn, UserPlus, Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    if (saved) document.documentElement.classList.add('dark');
  }, []);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      document.cookie = 'demo_mode=true; path=/; max-age=86400';
      toast.success('Mode Demo aktif!');
      window.location.href = '/dashboard';
    } catch {
      toast.error('Demo tidak tersedia saat ini');
    } finally {
      setDemoLoading(false);
    }
  };

  const navLinks = [
    { href: '#cara-kerja', label: 'Cara Kerja' },
    { href: '#produk', label: 'Produk' },
    { href: '#testimoni', label: 'Testimoni' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav className="fixed w-full top-0 z-50 bg-white dark:bg-[#0a0a0a] border-b-2 border-black dark:border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <QrCode size={20} className="text-white dark:text-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-black dark:text-white uppercase">
              BALIK.IN
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:hover:text-white px-3 py-2 transition-colors border border-transparent hover:border-black dark:hover:border-white disabled:opacity-50"
            >
              <Gamepad2 size={16} />
              {demoLoading ? '[LOADING]' : '[DEMO]'}
            </button>

            <a
              href="/login"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black dark:text-white px-5 py-2.5 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            >
              <LogIn size={16} />
              LOGIN
            </a>

            <a
              href="/register"
              className="flex items-center gap-1.5 text-sm font-semibold btn-primary !py-2 !px-4 !rounded-full"
            >
              <UserPlus size={14} />
              Daftar Gratis
            </a>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300"
              aria-label="Buka menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-slate-200 dark:border-slate-700 px-4 pb-4"
          >
            <div className="pt-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-slate-700 dark:text-slate-300 font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black dark:border-white text-black dark:text-white font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
                >
                  <Gamepad2 size={16} /> {demoLoading ? '[LOADING]' : '[DEMO]'}
                </button>
                <a href="/login" className="w-full btn-outline !py-2.5 flex items-center justify-center gap-2">
                  <LogIn size={16} /> Masuk
                </a>
                <a href="/register" className="w-full btn-primary !py-2.5 flex items-center justify-center gap-2">
                  <UserPlus size={16} /> Daftar Gratis
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
