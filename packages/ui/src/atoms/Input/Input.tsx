import { Field, Input as HeadlessInput, Label } from '@headlessui/react';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import { Box } from '../Box';
import { Text } from '../Text';
import { InputProps } from './Input.model';
import styles from './Input.module.scss';

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, ...rest }, ref) => {
  return (
    <Box className={styles.root}>
      <Field>
        {label && <Label className={styles.label}>{label}</Label>}
        <HeadlessInput ref={ref} className={clsx(styles.input, error && styles.error, className)} {...rest} />
        {hint && !error && <Text className={styles.hint}>{hint}</Text>}
        {error && <Text className={styles.errorText}>{error}</Text>}
      </Field>
    </Box>
  );
});

Input.displayName = 'Input';
