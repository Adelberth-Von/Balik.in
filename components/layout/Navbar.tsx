'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, QrCode, LogIn, UserPlus, Gamepad2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const saved = localStorage.getItem('darkMode') === 'true';
    setIsDark(saved);
    if (saved) document.documentElement.classList.add('dark');
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const demoEmail = 'admin@balik.in';
      const demoPassword = 'admin1234';
      const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
      
      if (error && (error.message === 'Invalid login credentials' || error.message.includes('Invalid'))) {
        const { error: regError } = await supabase.auth.signUp({ 
          email: demoEmail, 
          password: demoPassword,
          options: { data: { full_name: 'Admin Balik.in' } }
        });
        if (!regError) {
          toast.success('🎮 Masuk Mode Demo (Admin)!');
          router.push('/dashboard');
          return;
        }
      } else if (error) {
        throw error;
      }
      
      toast.success('🎮 Masuk Mode Demo (Admin)!');
      router.push('/dashboard');
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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <QrCode size={20} className="text-white dark:text-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-black dark:text-white uppercase">
              BALIK.IN
            </span>
          </Link>

          {/* Desktop Nav Links */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black dark:hover:text-white px-3 py-2 transition-colors border border-transparent hover:border-black dark:hover:border-white"
            >
              <Gamepad2 size={16} />
              {demoLoading ? '[LOADING]' : '[DEMO]'}
            </button>

            <Link
              href="/login"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black dark:text-white px-5 py-2.5 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            >
              <LogIn size={16} />
              LOGIN
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm font-semibold btn-primary !py-2 !px-4 !rounded-full"
            >
              <UserPlus size={14} />
              Daftar Gratis
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-300"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
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
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-black dark:border-white text-black dark:text-white font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  <Gamepad2 size={16} /> [DEMO]
                </button>
                <Link href="/login" className="w-full btn-outline !py-2.5 flex items-center justify-center gap-2">
                  <LogIn size={16} /> Masuk
                </Link>
                <Link href="/register" className="w-full btn-primary !py-2.5 flex items-center justify-center gap-2">
                  <UserPlus size={16} /> Daftar Gratis
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
