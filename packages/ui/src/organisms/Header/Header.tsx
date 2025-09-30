import { Flex, FlexProps, Heading } from '@chakra-ui/react';
import { ReactNode } from 'react';
import styles from './Header.module.scss';

export function Header({ children, ...props }: FlexProps & { children?: ReactNode }) {
  return (
    <Flex as="header" className={styles.root} align="center" justify="space-between" p={4} bg="gray.50" {...props}>
      <Heading size="md">Luma CMS</Heading>
      {children}
    </Flex>
  );
}
