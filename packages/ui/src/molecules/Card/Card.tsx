import { Box, BoxProps } from '@chakra-ui/react';
import { ReactNode } from 'react';
import styles from './Card.module.scss';

export function Card({ children, ...props }: BoxProps & { children: ReactNode }) {
  return (
    <Box className={styles.root} borderRadius="md" boxShadow="md" p={4} bg="white" {...props}>
      {children}
    </Box>
  );
}
