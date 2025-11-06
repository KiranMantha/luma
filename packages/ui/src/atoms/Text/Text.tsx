import { clsx } from 'clsx';
import styles from './Text.module.scss';

export type TextProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  color?: 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
};

export const Text = ({ as: Component = 'p', size, weight, color, className, children, ...props }: TextProps) => {
  return (
    <Component
      className={clsx(
        styles.text,
        size && styles[`size${size}`],
        weight && styles[weight],
        color && styles[color],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

Text.displayName = 'Text';
