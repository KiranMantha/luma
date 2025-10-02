import NextLink, { LinkProps } from 'next/link';
import { ReactNode } from 'react';
import styles from './Link.module.scss';

export const Link = ({ className = '', ...rest }: LinkProps & { className?: string; children?: ReactNode }) => {
  return <NextLink className={`${styles.link} ${className}`} {...rest} />;
};
