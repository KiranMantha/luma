import { ButtonProps, Button as RadixButton } from '@radix-ui/themes';
import styles from './Button.module.scss';

export function Button(props: ButtonProps) {
  return <RadixButton className={styles.button} {...props} />;
}
