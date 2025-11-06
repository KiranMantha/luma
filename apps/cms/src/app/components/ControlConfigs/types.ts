import { ChangeEvent } from 'react';

// Base config type that all control configs extend
export type BaseControlConfig = {
  label: string;
  required: boolean;
};

// Specific config types for each control type
export type TextControlConfig = BaseControlConfig & {
  placeholder: string;
  multiline: boolean;
  maxLength?: number;
};

export type EnumerationControlConfig = BaseControlConfig & {
  placeholder: string;
  options: string[];
};

export type ImageControlConfig = BaseControlConfig & {
  allowedTypes: string[];
  maxSize?: number;
};

export type RichTextControlConfig = BaseControlConfig & {
  toolbar: string[];
  maxLength?: number;
};

export type JsonControlConfig = BaseControlConfig & {
  schema: string;
  pretty: boolean;
};

export type TableControlConfig = BaseControlConfig & {
  title: string;
  caption: string;
  footnote: string;
  headers: Array<{
    id: string;
    label: string;
    type?: 'text' | 'textarea';
  }>;
};

// Union type for all possible configs
export type ControlConfig =
  | TextControlConfig
  | EnumerationControlConfig
  | ImageControlConfig
  | RichTextControlConfig
  | JsonControlConfig
  | TableControlConfig;

// Base props that all control config components will receive
export type BaseControlConfigProps<T = BaseControlConfig> = {
  config: T;
  onConfigChange: (config: T) => void;
};

// Common input event type
export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
