import type { ControlInstance } from './controls.model';

export type AddControlDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddControl: (controlType: string, config: unknown) => void;
  initialControl?: ControlInstance | null;
  mode?: 'add' | 'edit';
};

export type ConfigStep = 'select' | 'configure';
