'use client';

import { Link } from '@repo/ui';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/components', label: 'Component Builder' },
  { href: '/templates', label: 'Templates' },
  { href: '/pages', label: 'Pages' },
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
