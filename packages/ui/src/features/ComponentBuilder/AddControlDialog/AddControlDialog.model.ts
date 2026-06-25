import type { ControlInstance } from '../models';

export type AddControlDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddControl: (controlType: string, label: string, config: Record<string, unknown>) => void;
  initialControl?: ControlInstance | null;
  mode?: 'add' | 'edit';
};

export type ConfigStep = 'select' | 'configure';
