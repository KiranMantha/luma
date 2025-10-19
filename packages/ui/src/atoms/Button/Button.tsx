import { Button as HeadlessButton } from '@headlessui/react';
import { clsx } from 'clsx';
import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: '1' | '2' | '3' | 'sm' | 'md' | 'lg';
  color?: 'blue' | 'red' | 'gray' | 'green';
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
};

const sizeStyles = {
  '1': 'px-2 py-1 text-xs',
  sm: 'px-2 py-1 text-xs',
  '2': 'px-3 py-1.5 text-sm',
  md: 'px-3 py-1.5 text-sm',
  '3': 'px-4 py-2 text-base',
  lg: 'px-4 py-2 text-base',
};

const colorStyles = {
  blue: {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-blue-700 hover:bg-blue-100 focus:ring-blue-500',
  },
  red: {
    primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    outline: 'border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500',
    ghost: 'text-red-700 hover:bg-red-100 focus:ring-red-500',
  },
  gray: {
    primary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  },
  green: {
    primary: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    outline: 'border-green-300 text-green-700 hover:bg-green-50 focus:ring-green-500',
    ghost: 'text-green-700 hover:bg-green-100 focus:ring-green-500',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = '2', color = 'blue', className, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    let variantClass = variantStyles[variant];

    // Override with color-specific styles if specified
    if (
      color &&
      color !== 'blue' &&
      colorStyles[color] &&
      colorStyles[color][variant as keyof (typeof colorStyles)[typeof color]]
    ) {
      variantClass = colorStyles[color][variant as keyof (typeof colorStyles)[typeof color]];
    }

    const sizeClass = sizeStyles[size];

    return (
      <HeadlessButton ref={ref} className={clsx(baseClasses, variantClass, sizeClass, className)} {...props}>
        {children}
      </HeadlessButton>
    );
  },
);

Button.displayName = 'Button';
