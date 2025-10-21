import { TextareaProps as HeadlessTextareaProps } from '@headlessui/react';

export type TextareaProps = HeadlessTextareaProps & {
  label?: string;
  error?: string;
  hint?: string;
};
