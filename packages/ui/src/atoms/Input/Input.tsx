import { Box, TextField } from '@radix-ui/themes';
import { Label } from 'radix-ui';
import { InputProps } from './Input.model';
import styles from './Input.module.scss';

export const Input = ({ invalid, label, ...rest }: InputProps) => {
  return (
    <Box>
      {label && <Label.Root>{label}</Label.Root>}
      <TextField.Root size="3" className={styles.root} {...rest}></TextField.Root>
    </Box>
  );
};
