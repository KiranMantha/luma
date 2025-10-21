import { Link, Text } from '#atoms';
import styles from './Header.module.scss';

export function Header() {
  return (
    <header className={styles.header}>
      <Text as="h1" size="9" weight="bold">
        <Link href="/">Luma</Link>
      </Text>
    </header>
  );
}
