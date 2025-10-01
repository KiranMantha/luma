import { Text as RadixText, TextProps } from '@radix-ui/themes';
import styles from './Text.module.scss';

export function Text(props: TextProps) {
  return <RadixText className={styles.root} {...props} />;
}
