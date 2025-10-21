export type SelectProps = Omit<React.InputHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
};

type SelectOption = {
  label: string;
  value: string | number;
};
