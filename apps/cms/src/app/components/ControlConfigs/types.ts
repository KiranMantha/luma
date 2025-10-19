import { ChangeEvent } from 'react';

// Base config interface that all control configs extend
export interface BaseControlConfig {
  label: string;
  required: boolean;
}

// Specific config interfaces for each control type
export interface TextControlConfig extends BaseControlConfig {
  placeholder: string;
  multiline: boolean;
  maxLength?: number;
}

export interface EnumerationControlConfig extends BaseControlConfig {
  placeholder: string;
  options: string[];
}

export interface ImageControlConfig extends BaseControlConfig {
  allowedTypes: string[];
  maxSize?: number;
}

export interface RichTextControlConfig extends BaseControlConfig {
  toolbar: string[];
  maxLength?: number;
}

export interface JsonControlConfig extends BaseControlConfig {
  schema: string;
  pretty: boolean;
}

export interface TableControlConfig extends BaseControlConfig {
  title: string;
  caption: string;
  footnote: string;
  headers: Array<{
    id: string;
    label: string;
    type?: 'text' | 'textarea';
  }>;
}

// Union type for all possible configs
export type ControlConfig =
  | TextControlConfig
  | EnumerationControlConfig
  | ImageControlConfig
  | RichTextControlConfig
  | JsonControlConfig
  | TableControlConfig;

// Base props that all control config components will receive
export interface BaseControlConfigProps<T extends BaseControlConfig = BaseControlConfig> {
  config: T;
  onConfigChange: (config: T) => void;
}

// Common input event type
export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = ChangeEvent<HTMLTextAreaElement>;
