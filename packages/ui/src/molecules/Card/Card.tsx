import { Box, BoxProps } from '@radix-ui/themes';
import { ReactNode } from 'react';
import styles from './Card.module.scss';

export function Card({ children, ...props }: BoxProps & { children: ReactNode }) {
  return (
    <Box className={styles.card} {...props}>
      {children}
    </Box>
  );
}
