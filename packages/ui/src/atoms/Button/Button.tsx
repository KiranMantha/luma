import { Button as HeadlessButton } from '@headlessui/react';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import styles from './Button.module.scss';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'reg' | 'md' | 'lg';
  variant?: 'primary' | 'primary-outline' | 'danger' | 'danger-outline' | 'ghost';
  color?: 'blue' | 'red';
  children: React.ReactNode;
};

const variantClassMap = {
  primary: styles.primary,
  'primary-outline': styles.primaryOutline,
  danger: styles.danger,
  'danger-outline': styles.dangerOutline,
  ghost: styles.ghost,
};

const colorClassMap = {
  blue: styles.blue,
  red: styles.red,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'md', variant = 'primary', color = 'blue', className, children, ...props }, ref) => {
    return (
      <HeadlessButton
        ref={ref}
        className={clsx(
          styles.button,
          styles[size],
          variantClassMap[variant],
          color && colorClassMap[color],
          className,
        )}
        {...props}
      >
        {children}
      </HeadlessButton>
    );
  },
);

Button.displayName = 'Button';
