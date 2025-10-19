import { clsx } from 'clsx';
import { forwardRef } from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  columns?: '1' | '2' | '3' | '4' | '5' | '6' | '12';
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
}

const columnStyles = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-2',
  '3': 'grid-cols-3',
  '4': 'grid-cols-4',
  '5': 'grid-cols-5',
  '6': 'grid-cols-6',
  '12': 'grid-cols-12',
};

const gapStyles = {
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
};

export const Grid = forwardRef<HTMLElement, GridProps>(
  ({ as: Component = 'div', columns = '1', gap = '2', className, children, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx('grid', columnStyles[columns], gapStyles[gap], className)} {...props}>
        {children}
      </Component>
    );
  },
);

Grid.displayName = 'Grid';
