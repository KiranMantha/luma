'use client';

import { Box, Button, Flex, Modal, Text } from '@repo/ui';

export type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  componentName: string;
};

export const DeleteConfirmDialog = ({ open, onOpenChange, onConfirm, componentName }: DeleteConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Delete Component">
      <Box className="space-y-4">
        <Text size="3">
          Are you sure you want to delete the component <strong>&ldquo;{componentName}&rdquo;</strong>?
        </Text>
        <Text size="2" style={{ color: 'var(--red-11)' }}>
          This action cannot be undone. All controls and sections within this component will also be deleted.
        </Text>
        <Flex gap="3" justify="end" className="mt-6">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" color="red" onClick={handleConfirm}>
            Delete Component
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
