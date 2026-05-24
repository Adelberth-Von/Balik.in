'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, Gamepad2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import BrandLogo from '@/components/layout/BrandLogo';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    agreeTerms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (!formData.agreeTerms) {
      toast.error('Kamu harus menyetujui syarat & ketentuan');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phone,
            whatsapp_number: formData.sameAsPhone ? formData.phone : formData.whatsapp,
          },
        },
      });
      if (error) throw error;
      document.cookie = 'demo_mode=; path=/; max-age=0';
      toast.success('Akun berhasil dibuat! Selamat datang di Balik.In');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftar';
      toast.error(message.includes('already registered') ? 'Email sudah terdaftar' : message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      document.cookie = 'demo_mode=true; path=/; max-age=86400';
      toast.success('Mode Demo aktif!');
      window.location.href = '/dashboard';
    } catch {
      toast.error('Demo tidak tersedia');
    } finally {
      setDemoLoading(false);
    }
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all text-sm";
  const inputWithIcon = `${inputClass} pl-10`;

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <BrandLogo variant="icon" priority className="mx-auto mb-4 h-12 w-12" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Buat Akun</h1>
            <p className="text-zinc-400 text-sm mt-1">Bergabung dengan Balik.In sekarang</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block">Nama Lengkap</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input name="fullName" type="text" value={formData.fullName} onChange={handleChange}
                  className={inputWithIcon} placeholder="Nama lengkapmu" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input name="email" type="email" value={formData.email} onChange={handleChange}
                  className={inputWithIcon} placeholder="nama@email.com" required />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={formData.password}
                    onChange={handleChange} className={`${inputWithIcon} pr-8`} placeholder="Min. 6 karakter" required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block">Konfirmasi</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input name="confirmPassword" type={showPass ? 'text' : 'password'} value={formData.confirmPassword}
                    onChange={handleChange} className={inputWithIcon} placeholder="Ulangi" required />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1.5 block">Nomor HP</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                  className={inputWithIcon} placeholder="08xxxxxxxxxx" required />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-medium">WhatsApp</label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
                  <input type="checkbox" name="sameAsPhone" checked={formData.sameAsPhone}
                    onChange={handleChange} className="rounded accent-white" />
                  Sama dengan HP
                </label>
              </div>
              {!formData.sameAsPhone && (
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange}
                    className={inputWithIcon} placeholder="08xxxxxxxxxx" />
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms}
                onChange={handleChange} className="mt-0.5 rounded accent-white" required />
              <span className="text-sm text-zinc-400">
                Saya setuju dengan{' '}
                <Link href="/terms" className="text-white hover:text-zinc-200 underline underline-offset-2">Syarat & Ketentuan</Link>
                {' '}dan{' '}
                <Link href="/privacy" className="text-white hover:text-zinc-200 underline underline-offset-2">Kebijakan Privasi</Link>
              </span>
            </label>

            <button type="submit" disabled={loading} id="register-btn"
              className="w-full bg-white text-black font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
              {loading ? 'Membuat akun...' : 'Daftar Sekarang'}
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

          <button onClick={handleDemoLogin} disabled={demoLoading} id="demo-register-btn"
            className="w-full bg-zinc-800 text-white font-semibold rounded-lg px-4 py-2.5 border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Gamepad2 size={16} />
            {demoLoading ? 'Memuat Demo...' : 'Coba Mode Demo'}
          </button>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-white font-semibold hover:text-zinc-200 transition-colors">Masuk</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
