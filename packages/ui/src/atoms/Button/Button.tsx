import { ButtonProps, Button as ChakraButton } from '@chakra-ui/react';
import styles from './Button.module.scss';

export function Button(props: ButtonProps) {
  return <ChakraButton className={styles.root} {...props} />;
}
