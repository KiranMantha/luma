import { Text as ChakraText, TextProps } from '@chakra-ui/react';
import styles from './Text.module.scss';

export function Text(props: TextProps) {
  return <ChakraText className={styles.root} {...props} />;
}
