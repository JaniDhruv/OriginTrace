import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive User Guide',
  description: 'Master the complete OriginTrace pipeline — from real-time scanning to DMCA takedowns.',
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
