'use client';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { ReactNode } from 'react';

const customTheme = createSystem(defaultConfig);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ChakraProvider value={customTheme}>{children}</ChakraProvider>;
};

export default customTheme;
