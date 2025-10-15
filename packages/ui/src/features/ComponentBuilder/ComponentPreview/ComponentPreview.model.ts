import { Component, ControlInstance } from '../models';

export type ComponentPreviewProps = {
  component: Component | null;
  onAddControl?: () => void;
  onEditControl?: (control: ControlInstance) => void;
};

export type TextBoxConfig = {
  label: string;
  multiline: boolean;
  placeholder?: string;
  required?: boolean;
};
