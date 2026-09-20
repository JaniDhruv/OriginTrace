import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

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
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="header-logo">
              <span className="header-logo-icon">OT</span>
              OriginTrace
            </Link>
            <nav className="header-nav">
              <Link href="/">Check</Link>
              <Link href="/portfolio">Portfolio</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
