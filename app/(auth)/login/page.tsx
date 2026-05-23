'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, QrCode, Gamepad2, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@balik.in');
  const [password, setPassword] = useState('admin1234');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (email === 'demo@balik.in') {
      setLoading(true);
      document.cookie = "demo_mode=true; path=/";
      toast.success('Mode Demo aktif! Selamat menjelajahi Balik.In');
      window.location.href = '/dashboard';
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Berhasil masuk!');
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Email atau password salah';
      toast.error(message === 'Invalid login credentials' ? 'Email atau password salah' : message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      document.cookie = "demo_mode=true; path=/";
      toast.success('Mode Demo aktif! Selamat menjelajahi Balik.In');
      window.location.href = '/dashboard';
    } catch {
      toast.error('Demo tidak tersedia.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={24} className="text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Masuk ke akun Balik.In Anda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all text-sm"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 pl-10 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-btn"
              className="w-full bg-white text-black font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <LogIn size={16} />
              {loading ? 'Memuat...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-900 px-3 text-xs text-zinc-500">atau</span>
            </div>
          </div>

          {/* Demo Button */}
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            id="demo-login-btn"
            className="w-full bg-zinc-800 text-white font-semibold rounded-lg px-4 py-2.5 border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Gamepad2 size={16} />
            {demoLoading ? 'Memuat Demo...' : 'Coba Mode Demo'}
          </button>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Belum punya akun?{' '}
            <Link href="/register" className="text-white font-semibold hover:text-zinc-200 transition-colors">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
