import { TextField } from '@radix-ui/themes';

export type InputProps = TextField.RootProps & {
  label?: string;
  invalid?: boolean;
};
