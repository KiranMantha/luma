'use client';

import { Box, Button, Flex, Modal, Text } from '@repo/ui';

export type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  componentName: string;
  itemType?: 'component' | 'template';
};

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  componentName,
  itemType = 'component',
}: DeleteConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
  const deleteMessage =
    itemType === 'template'
      ? 'This action cannot be undone. All zones and components within this template will also be deleted.'
      : 'This action cannot be undone. All controls and sections within this component will also be deleted.';

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Delete ${itemTypeCapitalized}`}>
      <Box className="space-y-4">
        <Text size="3">
          Are you sure you want to delete the {itemType} <strong>&ldquo;{componentName}&rdquo;</strong>?
        </Text>
        <Text size="2" style={{ color: 'var(--red-11)' }}>
          {deleteMessage}
        </Text>
        <Flex gap="3" justify="end" className="mt-6">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" color="red" onClick={handleConfirm}>
            Delete {itemTypeCapitalized}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
