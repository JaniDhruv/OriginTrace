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
    default: 'OriginTrace — Live Scan',
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
      </body>
    </html>
  );
}
