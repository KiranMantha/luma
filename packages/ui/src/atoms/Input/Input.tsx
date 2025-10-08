import { Box, Text, TextField } from '@radix-ui/themes';
import { InputProps } from './Input.model';
import styles from './Input.module.scss';

export const Input = ({ label, ...rest }: InputProps) => {
  return (
    <Box>
      {label && (
        <Text as="label" size="2" style={{ display: 'block', marginBottom: '4px' }}>
          {label}
        </Text>
      )}
      <TextField.Root size="3" className={styles.root} {...rest} />
    </Box>
  );
};
