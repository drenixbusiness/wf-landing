import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Lora } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import World from '@/components/World';
import PageEffects from '@/components/PageEffects';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});
const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Wildfire Express — CDL-A OTR Dry Van Driver Jobs',
  description: 'Wildfire Express LLC (USDOT 3498707, MC 1154036) — 53′ dry van OTR carrier hiring CDL-A drivers across the lower 48 states.',
  icons: { icon: '/assets/favicon.png', apple: '/assets/apple-touch-icon.png' },
  openGraph: {
    siteName: 'Wildfire Express',
    type: 'website',
    images: [{ url: '/assets/poster.jpg', width: 1440, height: 900 }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#141210',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        {/* marks JS as available before paint so reveal styles never flash */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <World />
        <div className="poster" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        <div className="loader" data-loader="" aria-hidden="true"><span>Loading the rig</span></div>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <PageEffects />
      </body>
    </html>
  );
}
