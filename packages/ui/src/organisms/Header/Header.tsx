import { Link, Text } from '#atoms';
import { ReactNode } from 'react';
import styles from './Header.module.scss';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.cmsName}>
        <Text as="h1" size="9" weight="bold">
          <Link href="/">Luma</Link>
        </Text>
      </div>
      <div className={styles.content}>{children}</div>
    </header>
  );
}
