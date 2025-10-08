/**
 * Built-in controls/primitives that can be added to user-defined components
 */

export interface ControlDefinition {
  id: string;
  name: string;
  description: string;
  category: 'input' | 'display' | 'structure';
  icon?: string;
  configurable: boolean;
}

export interface ControlInstance {
  id: string;
  controlType: string;
  label?: string;
  config: Record<string, unknown>;
  order: number;
}

export interface TextBoxConfig {
  label: string;
  multiline: boolean;
  placeholder?: string;
  required?: boolean;
}

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
