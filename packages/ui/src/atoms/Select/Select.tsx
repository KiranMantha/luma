import { Field, Select as HeadlessSelect, Label } from '@headlessui/react';
import { forwardRef } from 'react';
import { Box } from '../Box';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { SelectProps } from './Select.model';
import styles from './Select.module.scss';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, options, hint, error }, ref) => {
  return (
    <Box className={styles.root}>
      <Field>
        {label && <Label className={styles.label}>{label}</Label>}
        <Box className="relative">
          <HeadlessSelect ref={ref} className={styles.select}>
            {options.map(({ label, value }) => {
              return (
                <option key={label} value={value}>
                  {label}
                </option>
              );
            })}
          </HeadlessSelect>
          <Icon name="chevron-down" className={styles.downIcon} />
        </Box>
        {hint && !error && <Text className={styles.hint}>{hint}</Text>}
        {error && <Text className={styles.errorText}>{error}</Text>}
      </Field>
    </Box>
  );
});

Select.displayName = 'Select';
