import { clsx } from 'clsx';
import { forwardRef } from 'react';
import styles from './Flex.module.scss';

export interface FlexProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
}

const directionClassMap = {
  row: styles.row,
  column: styles.column,
  'row-reverse': styles.rowReverse,
  'column-reverse': styles.columnReverse,
};

const alignClassMap = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
  baseline: styles.alignBaseline,
};

const justifyClassMap = {
  start: styles.justifyStart,
  center: styles.justifyCenter,
  end: styles.justifyEnd,
  between: styles.justifyBetween,
  around: styles.justifyAround,
  evenly: styles.justifyEvenly,
};

const wrapClassMap = {
  wrap: styles.wrap,
  nowrap: styles.nowrap,
  'wrap-reverse': styles.wrapReverse,
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

export const Flex = forwardRef<HTMLElement, FlexProps>(
  (
    {
      as: Component = 'div',
      direction = 'row',
      align = 'center',
      justify = 'start',
      wrap = 'nowrap',
      gap = '2',
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          styles.flex,
          directionClassMap[direction],
          alignClassMap[align],
          justifyClassMap[justify],
          wrapClassMap[wrap],
          gapClassMap[gap],
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Flex.displayName = 'Flex';
