import type { Metadata, Viewport } from 'next';
import { Caveat, DM_Sans } from 'next/font/google';
import './globals.css';

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'My Stride Buddy — Send Encouragement',
  description: 'Record a voice message to cheer on your runner during their workout.',
  openGraph: {
    title: 'Someone wants your encouragement!',
    description: 'Record a voice message for your runner — it will play during their workout to keep them going.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FDFAF4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${dmSans.variable}`}>
      <body className="font-body bg-cream-50 text-ink-800 antialiased">
        {children}
      </body>
    </html>
  );
}
