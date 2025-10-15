'use client';

import { Link } from '@repo/ui';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/components', label: 'Components' },
  { href: '/pages', label: 'Pages' },
  { href: '/templates', label: 'Templates' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav>
      <ul>
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={pathname === item.href ? 'active' : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
