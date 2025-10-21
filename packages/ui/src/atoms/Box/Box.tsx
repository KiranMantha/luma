import { clsx } from 'clsx';
import { forwardRef } from 'react';
import styles from './Box.module.scss';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
}

export const Box = forwardRef<HTMLElement, BoxProps>(
  ({ as: Component = 'div', className, children, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx(styles.box, className)} {...props}>
        {children}
      </Component>
    );
  },
);

Box.displayName = 'Box';
