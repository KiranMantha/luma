import { Link } from '#atoms';
import { Heading } from '@radix-ui/themes';
import { ReactNode } from 'react';
import styles from './Header.module.scss';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.cmsName}>
        <Heading>
          <Link href="/">Luma</Link>
        </Heading>
      </div>
      <div className={styles.content}>{children}</div>
    </header>
  );
}
