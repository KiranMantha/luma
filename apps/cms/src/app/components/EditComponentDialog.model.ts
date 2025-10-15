import type { Component } from '@repo/ui';

export type EditComponentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, name: string, description?: string) => Promise<void>;
  component: Component | null;
};
