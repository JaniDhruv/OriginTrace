'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Scan' },
  { href: '/history', label: 'History' },
  { href: '/chat', label: 'Agent Chat' },
  { href: '/guide', label: 'User Guide' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="header-nav">
      {links.map(({ href, label }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={isActive ? 'nav-link nav-link-active' : 'nav-link'}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
