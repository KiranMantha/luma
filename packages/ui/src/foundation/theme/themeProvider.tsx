import { Theme } from '@radix-ui/themes';
import { ReactNode } from 'react';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return <Theme>{children}</Theme>;
};
