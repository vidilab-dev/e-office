import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'e-Office PT BIN — Platform Workflow Perkantoran Terpadu',
  description:
    'Platform workflow persuratan, disposisi, approval berjenjang, cuti, perjalanan dinas (SPD/LPJ), arsip digital, dan monitoring eksekutif PT BIN.',
  openGraph: {
    title: 'e-Office PT BIN — Platform Workflow Perkantoran Terpadu',
    description:
      'Platform workflow persuratan, disposisi, approval berjenjang, cuti, perjalanan dinas (SPD/LPJ), arsip digital, dan monitoring eksekutif PT BIN.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="data:," />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
