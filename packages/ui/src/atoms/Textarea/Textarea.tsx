import { Field, Textarea as HeadlessTextarea, Label } from '@headlessui/react';
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Box } from '../Box';
import { Text } from '../Text';
import { TextareaProps } from './Textarea.model';
import styles from './Textarea.module.scss';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...rest }, ref) => {
    return (
      <Box className={styles.root}>
        <Field>
          {label && <Label className={styles.label}>{label}</Label>}
          <HeadlessTextarea ref={ref} className={clsx(styles.textarea, error && styles.error, className)} {...rest} />
          {hint && !error && <Text className={styles.hint}>{hint}</Text>}
          {error && <Text className={styles.errorText}>{error}</Text>}
        </Field>
      </Box>
    );
  },
);

Textarea.displayName = 'Textarea';
