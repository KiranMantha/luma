import type { Component, ControlInstance } from '../models';

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

// Re-export shared types for convenience
export type { Component, ControlInstance };
