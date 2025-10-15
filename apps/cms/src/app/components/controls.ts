// Built-in control definitions
export const BUILT_IN_CONTROLS: ControlDefinition[] = [
  {
    id: 'textbox',
    name: 'Text Box',
    description: 'Single line or multi-line text input field',
    category: 'input',
    icon: '📝',
    configurable: true,
  },
  // Future controls can be added here:
  // {
  //   id: 'image',
  //   name: 'Image',
  //   description: 'Image upload and display',
  //   category: 'display',
  //   icon: '🖼️',
  //   configurable: true,
  // },
];

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
