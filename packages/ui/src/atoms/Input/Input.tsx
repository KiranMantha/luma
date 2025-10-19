import { clsx } from 'clsx';
import { forwardRef } from 'react';
import { InputProps } from './Input.model';

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, ...rest }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'block w-full rounded-md border-gray-300 shadow-sm transition-colors',
          'focus:border-primary-500 focus:ring-primary-500 focus:ring-1',
          'disabled:bg-gray-50 disabled:text-gray-500',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
