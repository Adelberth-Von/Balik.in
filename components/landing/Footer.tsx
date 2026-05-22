import Link from 'next/link';
import { QrCode, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black dark:bg-white text-white dark:text-black py-16 px-4 border-t-4 border-black dark:border-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white dark:bg-black flex items-center justify-center border-2 border-white dark:border-black">
                <QrCode size={24} className="text-black dark:text-white" />
              </div>
              <span className="font-black text-3xl tracking-tighter uppercase">
                BALIK.IN
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest leading-loose mb-8 max-w-sm font-bold">
              SISTEM PEMULIHAN BARANG HILANG BRUTALIST & EFEKTIF UNTUK MAHASISWA DAN MASYARAKAT.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-3 border-2 border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors">
                <Mail size={20} />
              </a>
              <a href="#" className="p-3 border-2 border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors">
                <Phone size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-black uppercase tracking-widest text-lg mb-6 border-b-2 border-white dark:border-black pb-2 inline-block">PRODUK</h4>
            <ul className="space-y-4 text-xs font-bold tracking-widest uppercase">
              <li><Link href="#cara-kerja" className="hover:underline hover:opacity-75 transition-all">Cara Kerja</Link></li>
              <li><Link href="#produk" className="hover:underline hover:opacity-75 transition-all">Paket Label</Link></li>
              <li><Link href="#testimoni" className="hover:underline hover:opacity-75 transition-all">Klien</Link></li>
              <li><Link href="#faq" className="hover:underline hover:opacity-75 transition-all">F A Q</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase tracking-widest text-lg mb-6 border-b-2 border-white dark:border-black pb-2 inline-block">AKSES</h4>
            <ul className="space-y-4 text-xs font-bold tracking-widest uppercase">
              <li><Link href="/register" className="hover:underline hover:opacity-75 transition-all">[ REGISTER ]</Link></li>
              <li><Link href="/login" className="hover:underline hover:opacity-75 transition-all">[ LOGIN ]</Link></li>
              <li><Link href="/dashboard" className="hover:underline hover:opacity-75 transition-all">DASHBOARD</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-white dark:border-black pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-widest">
          <p>&copy; 2026 BALIK.IN // DIBANGUN DENGAN DISIPLIN.</p>
          <div className="flex gap-8">
            <Link href="/terms" className="hover:underline">SYARAT & KETENTUAN</Link>
            <Link href="/privacy" className="hover:underline">KEBIJAKAN PRIVASI</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
