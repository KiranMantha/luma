import { ControlType } from './ComponentPreview/ComponentPreview.model';

export type ControlDefinition = {
  description: string;
  icon: string;
  controlType: ControlType;
};

export const BUILT_IN_CONTROLS: ControlDefinition[] = [
  {
    description: 'Single line or multi-line text input field',
    icon: '📝',
    controlType: ControlType.TEXT,
  },
  {
    description: 'Dropdown selection from predefined options',
    icon: '📋',
    controlType: ControlType.ENUMERATION,
  },
  {
    description: 'Image upload and display with validation',
    icon: '🖼️',
    controlType: ControlType.MEDIA,
  },
  {
    description: 'Rich text editor with formatting options',
    icon: '📄',
    controlType: ControlType.RICHTEXT,
  },
  {
    description: 'JSON data input with schema validation',
    icon: '🔧',
    controlType: ControlType.JSON,
  },
  {
    description: 'Structured data table with customizable headers',
    icon: '📊',
    controlType: ControlType.TABLE,
  },
];
