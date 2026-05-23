import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import ForceTheme from '@/components/layout/ForceTheme';

export const metadata: Metadata = {
  title: 'Balik.In — Barang Tertinggal? Balikin Aja!',
  description: 'Sistem pemulihan barang hilang berbasis QR code. Tempelkan stiker QR ke barangmu. Penemu cukup scan — chat anonim, kirim lokasi GPS, langsung terhubung dengan pemilik.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <ForceTheme mode="light" />
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
