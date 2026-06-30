'use client';

import { Box, Button, Flex, Text } from '#atoms';
import { Modal } from '#molecules';

export type DeleteSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  sectionName: string;
};

export const DeleteSectionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  sectionName,
}: DeleteSectionDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Delete Section">
      <Box className="space-y-4">
        <Text size="3">
          Are you sure you want to delete the section <strong>&ldquo;{sectionName}&rdquo;</strong>?
        </Text>
        <Text size="2" style={{ color: 'var(--red-11)' }}>
          This action cannot be undone. All controls and fieldsets within this section will also be deleted.
        </Text>
        <Flex gap="3" justify="end" className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" color="red" onClick={handleConfirm}>
            Delete Section
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
