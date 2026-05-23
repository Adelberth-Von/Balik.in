import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import CustomCursor from '@/components/ui/CustomCursor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Balik.In — Barang Tertinggal? Balikin Aja!',
  description:
    'Sistem pemulihan barang hilang berbasis QR code. Tempelkan stiker QR ke barangmu. Jika ketinggalan, penemu cukup scan — pesan langsung ke kamu, tanpa bocorkan data pribadi.',
  keywords: ['barang hilang', 'QR code', 'lost and found', 'Yogyakarta', 'mahasiswa'],
  openGraph: {
    title: 'Balik.In — Barang Tertinggal? Balikin Aja!',
    description: 'Sistem pemulihan barang hilang berbasis QR code untuk mahasiswa Yogyakarta',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('darkMode') === 'true' || (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <CustomCursor />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '0px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              border: '2px solid black',
              boxShadow: 'none',
              background: 'white',
              color: 'black',
              fontWeight: 'bold',
            },
            success: {
              style: { border: '2px solid black', background: '#000000', color: 'white' },
              iconTheme: { primary: 'white', secondary: 'black' },
            },
            error: {
              style: { border: '2px solid black', background: '#ffffff', color: 'black' },
              iconTheme: { primary: 'black', secondary: 'white' },
            },
          }}
        />
      </body>
    </html>
  );
}
