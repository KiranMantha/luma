import { clsx } from 'clsx';
import { forwardRef } from 'react';
import { InputProps } from './Input.model';
import styles from './Input.module.scss';

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, ...rest }, ref) => {
  return (
    <div className={styles.root}>
      {label && <label className={styles.label}>{label}</label>}
      <input ref={ref} className={clsx(styles.input, error && styles.error, className)} {...rest} />
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
