import { Component, ControlInstance } from '../models';

export enum ControlType {
  TEXT = 'TEXT',
  ENUMERATION = 'ENUMERATION',
  MEDIA = 'MEDIA',
  RICHTEXT = 'RICHTEXT',
  JSON = 'JSON',
  TABLE = 'TABLE',
}

export type ComponentPreviewProps = {
  component: Component | null;
  onAddControl?: () => void;
  onEditControl?: (control: ControlInstance) => void;
  onDeleteControl?: (controlId: string) => void;
};

// Base configuration that all controls share
export type BaseControlConfig = {
  label: string;
  required?: boolean;
  placeholder?: string;
};

// Metadata that describes the control type characteristics
export type ControlMetadata = {
  displayName: string;
  type: ControlType;
  supportsMultiline?: boolean;
  supportsRichText?: boolean;
  supportsMedia?: boolean;
  supportsJson?: boolean;
  supportsTable?: boolean;
};

// Extended configs for specific control types
export type TextBoxConfig = BaseControlConfig & {
  multiline?: boolean;
};

export type EnumerationConfig = BaseControlConfig & {
  options: Array<{ label: string; value: string }>;
};

export type ImageConfig = BaseControlConfig & {
  maxSize?: number; // in MB
  allowedTypes?: string[]; // ['jpg', 'png', 'gif']
  width?: number;
  height?: number;
};

export type RichTextConfig = BaseControlConfig & {
  toolbar?: string[];
  maxLength?: number;
};

export type JsonConfig = BaseControlConfig & {
  schema?: Record<string, unknown>; // JSON schema for validation
  pretty?: boolean; // pretty print the JSON
};

export type TableConfig = BaseControlConfig & {
  caption?: string;
  footnote?: string;
  headers: Array<{
    id: string;
    label: string;
    type?: 'text' | 'number' | 'date';
  }>;
};

// Control metadata registry - simplified for your 5 core controls
export const CONTROL_METADATA: Record<ControlType, ControlMetadata> = {
  [ControlType.TEXT]: {
    displayName: 'Text',
    type: ControlType.TEXT,
    supportsMultiline: true,
  },
  [ControlType.ENUMERATION]: {
    displayName: 'Enumeration',
    type: ControlType.ENUMERATION,
  },
  [ControlType.MEDIA]: {
    displayName: 'Image',
    type: ControlType.MEDIA,
    supportsMedia: true,
  },
  [ControlType.RICHTEXT]: {
    displayName: 'Rich Text',
    type: ControlType.RICHTEXT,
    supportsRichText: true,
  },
  [ControlType.JSON]: {
    displayName: 'JSON',
    type: ControlType.JSON,
    supportsJson: true,
  },
  [ControlType.TABLE]: {
    displayName: 'Table',
    type: ControlType.TABLE,
    supportsTable: true,
  },
};
