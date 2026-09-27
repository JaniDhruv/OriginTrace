import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import NavLinks from './NavLinks';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: {
    template: 'OriginTrace — %s',
    default: 'OriginTrace — Scan for Plagiarism',
  },
  description:
    'AI-powered plagiarism detection for developer blog posts. Paste a DEV.to URL — OriginTrace crawls the web for stolen copies and generates DMCA takedown notices. Built on Sanity Content Lake.',
  openGraph: {
    title: 'OriginTrace — Protect Your Words',
    description:
      'AI agent that finds plagiarized copies of your DEV.to posts across the web and generates DMCA takedowns. Powered by Sanity Knowledge Base.',
    siteName: 'OriginTrace',
    type: 'website',
    url: 'https://github.com/JaniDhruv/OriginTrace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OriginTrace — Content Provenance Agent',
    description:
      'Find stolen copies of your blog posts and generate DMCA takedowns instantly. Built for the Sanity AI Challenge 2026.',
  },
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
              <Image src="/logo.jpg?v=2" alt="OriginTrace" width={40} height={40} className="header-logo-img" unoptimized />
              OriginTrace
            </Link>
            <NavLinks />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-brand">
              <Image src="/logo.jpg?v=2" alt="OriginTrace" width={28} height={28} className="header-logo-img" style={{ width: 28, height: 28, borderRadius: '50%' }} unoptimized />
              <span style={{ fontWeight: 700, background: 'linear-gradient(135deg, #e2e8f0 0%, var(--accent-secondary) 60%, var(--accent-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OriginTrace</span>
            </div>
            <p className="site-footer-tagline">
              Built for the{' '}
              <a href="https://dev.to/challenges/sanity-2026-09-16" target="_blank" rel="noopener noreferrer">
                Sanity AI Challenge 2026
              </a>{' '}
              · Powered by{' '}
              <a href="https://www.sanity.io" target="_blank" rel="noopener noreferrer">
                Sanity Content Lake
              </a>
            </p>
            <div className="site-footer-links">
              <a href="https://github.com/JaniDhruv/OriginTrace" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <span className="site-footer-dot">·</span>
              <a href="https://dev.to/dj29" target="_blank" rel="noopener noreferrer">
                DEV.to
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
