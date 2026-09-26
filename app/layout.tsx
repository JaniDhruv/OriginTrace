import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const jbMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'OriginTrace — Content Provenance Agent',
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
              <span className="header-logo-icon">OT</span>
              OriginTrace
            </Link>
            <nav className="header-nav">
              <Link href="/">Scan</Link>
              <Link href="/history">History</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-brand">
              <span className="header-logo-icon" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>OT</span>
              <span>OriginTrace</span>
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
