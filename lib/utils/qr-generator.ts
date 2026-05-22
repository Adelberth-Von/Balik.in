export function generateQrCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BLJN-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getQrUrl(qrCode: string): string {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Vercel auto-populates NEXT_PUBLIC_VERCEL_URL
  if (!baseUrl && process.env.NEXT_PUBLIC_VERCEL_URL) {
    baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  } else if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }

  // Bersihkan slash di akhir jika ada
  baseUrl = baseUrl.replace(/\/$/, '');

  return `${baseUrl}/scan/${qrCode}`;
}

export function isValidQrCode(code: string): boolean {
  return /^BLJN-[A-Z0-9]{8}$/.test(code) || /^BLJN-DEMO\d+$/.test(code);
}
