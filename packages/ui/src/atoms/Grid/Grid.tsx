import { clsx } from 'clsx';
import { forwardRef } from 'react';
import styles from './Grid.module.scss';

export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  columns?: '1' | '2' | '3' | '4' | '5' | '6' | '12';
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
}

const columnClassMap = {
  '1': styles.cols1,
  '2': styles.cols2,
  '3': styles.cols3,
  '4': styles.cols4,
  '5': styles.cols5,
  '6': styles.cols6,
  '12': styles.cols12,
};

const gapClassMap = {
  '1': styles.gap1,
  '2': styles.gap2,
  '3': styles.gap3,
  '4': styles.gap4,
  '5': styles.gap5,
  '6': styles.gap6,
  '8': styles.gap8,
};

export const Grid = forwardRef<HTMLElement, GridProps>(
  ({ as: Component = 'div', columns = '1', gap = '2', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={clsx(styles.grid, columnClassMap[columns], gapClassMap[gap], className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Grid.displayName = 'Grid';
