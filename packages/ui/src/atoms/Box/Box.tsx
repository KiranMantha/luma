import { clsx } from 'clsx';
import { forwardRef } from 'react';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
}

export const Box = forwardRef<HTMLElement, BoxProps>(
  ({ as: Component = 'div', className, children, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx('block', className)} {...props}>
        {children}
      </Component>
    );
  },
);

Box.displayName = 'Box';
