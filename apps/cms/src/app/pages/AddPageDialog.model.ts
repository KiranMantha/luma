export interface AddPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string, templateId?: string | null) => Promise<void>;
}
