import { clsx } from 'clsx';
import { forwardRef } from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
}

const directionStyles = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

const alignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyStyles = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const wrapStyles = {
  wrap: 'flex-wrap',
  nowrap: 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
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

export const Flex = forwardRef<HTMLElement, FlexProps>(
  (
    {
      as: Component = 'div',
      direction = 'row',
      align = 'start',
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
          'flex',
          directionStyles[direction],
          alignStyles[align],
          justifyStyles[justify],
          wrapStyles[wrap],
          gapStyles[gap],
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
