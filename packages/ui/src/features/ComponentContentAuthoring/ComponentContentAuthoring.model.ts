import type { Component, ComponentInstance, Template } from '../ComponentBuilder/models';

export type Page = {
  id: string;
  name: string;
  [key: string]: unknown;
};

export type ComponentContentAuthoringProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentInstance: ComponentInstance | null;
  component: Component | null;
  template?: Template | null;
  page?: Page | null;
  onSave?: (instanceId: string, content: Record<string, unknown>) => void;
  onContentSaved?: (instanceId: string, content: Record<string, unknown>) => void;
};
