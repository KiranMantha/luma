import { ControlType } from '@repo/ui';

// Built-in control definitions - Simplified to only UI-specific data
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

export type ControlDefinition = {
  description: string; // UI description text
  icon: string; // Display icon (all controls have icons)
  controlType: ControlType; // Unique identifier and links to CONTROL_METADATA
};

export type ControlInstance = {
  id: string;
  controlType: ControlType;
  label?: string;
  config: Record<string, unknown>;
  order: number;
};

export type TextBoxConfig = {
  label: string;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
};

export type EnumerationConfig = {
  label: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
};

export type ImageConfig = {
  label: string;
  allowedTypes?: string[]; // e.g., ['jpg', 'png', 'gif']
  maxSize?: number; // in MB
  required?: boolean;
};

export type RichTextConfig = {
  label: string;
  toolbar?: string[]; // e.g., ['bold', 'italic', 'link']
  maxLength?: number;
  required?: boolean;
};

export type JsonConfig = {
  label: string;
  schema?: Record<string, unknown>; // JSON schema for validation
  pretty?: boolean; // pretty print the JSON
  required?: boolean;
};

export type TableConfig = {
  label: string;
  caption?: string;
  footnote?: string;
  headers: Array<{
    id: string;
    label: string;
    type?: 'text' | 'number' | 'date';
  }>;
  required?: boolean;
};
