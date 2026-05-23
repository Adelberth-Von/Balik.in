'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Moon, Sun, Save, Lock, AlertTriangle, Package, QrCode, CheckCircle2, ChevronRight, Check, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as UserType } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ProfilClient({ profile: initialProfile, userId }: { profile: UserType | null; userId: string }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name || '',
    phone_number: initialProfile?.phone_number || '',
    whatsapp_number: initialProfile?.whatsapp_number || '',
    preferred_contact: initialProfile?.preferred_contact || 'chat',
    avatar_url: initialProfile?.avatar_url || '',
  });
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maksimal ukuran foto adalah 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let { width, height } = img;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(p => ({ ...p, avatar_url: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    setIsDark(saved !== 'false');
  }, []);

  const toggleDark = async () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
    await supabase.from('users').update({ dark_mode: next }).eq('id', userId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isPrototype =
        userId === 'demo123' ||
        initialProfile?.email === 'demo@balik.in' ||
        document.cookie.includes('demo_mode=true');

      if (isPrototype) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        toast.success('Profil prototype berhasil disimpan!');
        setIsEditing(false);
        return;
      }

      const { error } = await supabase.from('users').update(formData).eq('id', userId);
      if (error) throw error;
      
      if (email !== initialProfile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast.success('Profil disimpan. Cek inbox lama dan baru Anda untuk konfirmasi perubahan email!');
      } else {
        toast.success('Profil berhasil disimpan!');
      }
      setIsEditing(false);
    } catch (e: any) {
      const message = e?.message || '';
      if (message.includes('Could not find the table') || message.includes('Failed to fetch')) {
        toast.success('Profil disimpan dalam mode prototype.');
        setIsEditing(false);
        return;
      }
      toast.error(message || 'Gagal menyimpan'); 
    }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) { toast.error('Password tidak cocok'); return; }
    if (passwords.new.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      toast.success('Password berhasil diubah!');
      setPasswords({ new: '', confirm: '' });
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gagal'); }
    finally { setChangingPassword(false); }
  };

  const isDemo = initialProfile?.email === 'demo@balik.in';

  const inputClass = "w-full bg-white dark:bg-[#030303] border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 block";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">Kelola preferensi dan keamanan akun Anda.</p>
      </motion.div>

      {/* Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-sm"
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative">
          {formData.avatar_url ? (
            <div className="w-24 h-24 rounded-full p-1 shadow-xl bg-gradient-to-tr from-primary-400 to-primary-600 dark:from-zinc-200 dark:to-white">
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full bg-white dark:bg-zinc-950" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-gradient-to-tr from-primary-400 to-primary-600 dark:from-zinc-200 dark:to-white rounded-full p-1 shadow-xl">
              <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-full flex items-center justify-center text-3xl font-bold text-primary-600 dark:text-white">
                {initialProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}
          {isEditing && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span className="text-xl font-medium leading-none pb-1">+</span>
            </label>
          )}
        </div>

        <div className="flex-1 text-center md:text-left relative z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{initialProfile?.full_name}</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">{initialProfile?.email}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-5">
            {[
              { icon: Package, label: 'Barang', value: initialProfile?.total_items || 0 },
              { icon: QrCode, label: 'Scan', value: initialProfile?.total_scans || 0 },
              { icon: CheckCircle2, label: 'Kembali', value: initialProfile?.total_recovered || 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                <stat.icon size={13} className="text-slate-500 dark:text-zinc-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</span>
                <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Edit Info Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 dark:bg-zinc-900/30 border border-slate-200 dark:border-white/5 shadow-sm rounded-3xl p-6 md:p-8 space-y-6"
      >
        <div className="border-b border-slate-200 dark:border-white/5 pb-4 mb-6 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Informasi Pribadi</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold text-sm rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
              Edit Profil
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input disabled={!isEditing} type="text" value={formData.full_name} onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))} className={`${inputClass} pl-11 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900`} />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Alamat Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input disabled={!isEditing} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900`} />
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5"><AlertTriangle size={12}/> Mengubah email memerlukan konfirmasi ke inbox Anda.</p>
          </div>

          <div>
            <label className={labelClass}>Preferensi Kontak Default</label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select 
                disabled={!isEditing}
                value={formData.preferred_contact} 
                onChange={(e) => setFormData(p => ({ ...p, preferred_contact: e.target.value as any }))}
                className={`${inputClass} pl-11 appearance-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900`}
              >
                <option value="chat">Hanya Chat In-App</option>
                <option value="whatsapp">Hanya WhatsApp</option>
                <option value="both">Chat & WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Nomor HP</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input disabled={!isEditing} type="tel" value={formData.phone_number} onChange={(e) => setFormData(p => ({ ...p, phone_number: e.target.value }))} className={`${inputClass} pl-11 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900`} />
            </div>
          </div>

          <div>
            <label className={labelClass}>WhatsApp</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input disabled={!isEditing} type="tel" value={formData.whatsapp_number} onChange={(e) => setFormData(p => ({ ...p, whatsapp_number: e.target.value }))} className={`${inputClass} pl-11 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900`} />
            </div>
          </div>

          {/* Removed Avatar URL Field since we have file upload above */}
        </div>

        <div className="pt-4 flex items-center justify-between">
          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">{isDemo ? 'Mode demo: Perubahan tidak akan disimpan' : ''}</p>
          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFormData({
                    full_name: initialProfile?.full_name || '',
                    phone_number: initialProfile?.phone_number || '',
                    whatsapp_number: initialProfile?.whatsapp_number || '',
                    preferred_contact: initialProfile?.preferred_contact || 'chat',
                    avatar_url: initialProfile?.avatar_url || '',
                  });
                  setEmail(initialProfile?.email || '');
                  setIsEditing(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleSave();
                }} disabled={saving}
                className="bg-primary-600 dark:bg-white text-white dark:text-black font-semibold rounded-xl px-6 py-2.5 hover:bg-primary-700 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : <><Save size={16} /> Simpan Perubahan</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Keamanan & Password */}
      {!isDemo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-zinc-900/30 border border-slate-200 dark:border-white/5 shadow-sm rounded-3xl p-6 md:p-8 space-y-6"
        >
          <div className="border-b border-slate-200 dark:border-white/5 pb-4 mb-6 flex items-center gap-2">
            <Lock size={18} className="text-slate-500 dark:text-zinc-400" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Keamanan & Password</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Password Baru</label>
              <input type="password" value={passwords.new} onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))} className={inputClass} placeholder="Minimal 6 karakter" />
            </div>
            <div>
              <label className={labelClass}>Konfirmasi Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))} className={inputClass} placeholder="Ulangi password" />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleChangePassword} disabled={changingPassword || !passwords.new || !passwords.confirm}
              className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors border border-slate-200 dark:border-zinc-700 rounded-xl px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {changingPassword ? 'Memproses...' : 'Ubah Password'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Danger Zone */}
      {!isDemo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-3xl p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.03)_10px,rgba(220,38,38,0.03)_20px)] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-red-600 dark:text-red-500 text-lg flex items-center gap-2">
                <AlertTriangle size={18} /> Zona Bahaya
              </h3>
              <p className="text-red-700/80 dark:text-zinc-400 text-sm mt-1 max-w-md">Menghapus akun akan menghilangkan seluruh data barang, QR code, dan riwayat scan secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            
            <button
              onClick={() => {
                const c = prompt('Ketik HAPUS untuk konfirmasi penghapusan permanen:');
                if (c !== 'HAPUS') { toast.error('Dibatalkan'); }
                else { toast.error('Untuk keamanan, hubungi support@balik.in untuk penghapusan'); }
              }}
              className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 border border-red-200 dark:border-red-500/20 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              Hapus Akun Permanen
            </button>
          </div>
        </motion.div>
      )}

      {/* Logout Button (Very important for mobile where sidebar is hidden) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="pt-4 pb-12"
      >
        <button
          onClick={async () => {
            const { logoutAction } = await import('@/app/actions/auth');
            await logoutAction();
            localStorage.clear();
            sessionStorage.clear();
            toast.success('Berhasil keluar');
            window.location.href = '/'; 
          }}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 border border-slate-800 dark:border-white/20 px-6 py-4 rounded-2xl font-bold transition-all text-base flex items-center justify-center gap-2"
        >
          Keluar dari Akun
        </button>
      </motion.div>
    </div>
  );
}
