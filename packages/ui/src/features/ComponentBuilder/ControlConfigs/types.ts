import { ChangeEvent } from 'react';

export type BaseControlConfig = {
  label: string;
  required: boolean;
};

export type TextControlConfig = BaseControlConfig & {
  placeholder: string;
  multiline: boolean;
  maxLength?: number;
};

// options is string[] in dialog form state; buildApiConfig converts to Array<{label,value}> before saving.
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

export type ControlConfig =
  | TextControlConfig
  | EnumerationControlConfig
  | ImageControlConfig
  | RichTextControlConfig
  | JsonControlConfig
  | TableControlConfig;

export type BaseControlConfigProps<T = BaseControlConfig> = {
  config: T;
  onConfigChange: (config: T) => void;
};

export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
