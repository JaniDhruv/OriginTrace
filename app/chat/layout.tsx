import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Action Agent',
  description: 'Trigger programmatic plagiarism scans directly from chat. Powered by Sanity Context MCP.',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
