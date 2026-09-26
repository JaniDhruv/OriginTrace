import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'OriginTrace — Content Provenance Agent',
  description:
    'Verify content provenance using Sanity Knowledge Base reconciliation. Check any URL against your canonical portfolio to determine if content is original, credited, or an unattributed repost.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jbMono.variable}`}>
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="header-logo">
              <span className="header-logo-icon">OT</span>
              OriginTrace
            </Link>
            <nav className="header-nav">
              <Link href="/">Scan</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
