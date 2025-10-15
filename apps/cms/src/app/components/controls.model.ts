export type ControlDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'input' | 'display' | 'structure';
  icon?: string;
  configurable: boolean;
};

export type ControlInstance = {
  id: string;
  controlType: string;
  label?: string;
  config: Record<string, unknown>;
  order: number;
};

export type TextBoxConfig = {
  label: string;
  multiline: boolean;
  placeholder?: string;
  required?: boolean;
};
