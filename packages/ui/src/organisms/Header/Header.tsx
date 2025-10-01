import { Flex, FlexProps, Heading } from '@radix-ui/themes';
import { ReactNode } from 'react';

export function Header({ children, ...rest }: FlexProps & { children?: ReactNode }) {
  return (
    <Flex {...rest}>
      <Heading>Luma CMS</Heading>
      {children}
    </Flex>
  );
}
