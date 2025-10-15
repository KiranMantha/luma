import type { ControlDefinition } from './controls.model';

export type { ControlDefinition, ControlInstance, TextBoxConfig } from './controls.model';

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
