import { clsx } from 'clsx';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  color?: 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
}

const sizeStyles = {
  '1': 'text-xs',
  '2': 'text-sm',
  '3': 'text-base',
  '4': 'text-lg',
  '5': 'text-xl',
  '6': 'text-2xl',
  '7': 'text-3xl',
  '8': 'text-4xl',
  '9': 'text-5xl',
};

const weightStyles = {
  light: 'font-light',
  regular: 'font-normal',
  medium: 'font-medium',
  bold: 'font-bold',
};

const colorStyles = {
  gray: 'text-gray-600',
  red: 'text-red-600',
  green: 'text-green-600',
  blue: 'text-blue-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
};

export const Text = ({
  as: Component = 'p',
  size = '3',
  weight = 'regular',
  color,
  className,
  children,
  ...props
}: TextProps) => {
  return (
    <Component
      className={clsx(sizeStyles[size], weightStyles[weight], color && colorStyles[color], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

Text.displayName = 'Text';
