'use client';

import { Box, Flex } from '@radix-ui/themes';
import { Button, Input, Modal } from '@repo/ui';
import { ChangeEvent, useState } from 'react';

interface AddComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => Promise<void>;
}

export const AddComponentDialog = ({ open, onOpenChange, onSave }: AddComponentDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save component:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add New Component">
      <Box>
        <Box mb="4">
          <Input
            label="Component Name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter component name"
            required
          />
        </Box>
        <Box mb="4">
          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Enter component description"
          />
        </Box>
        <Flex gap="3" justify="end">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || loading}>
            {loading ? 'Saving...' : 'Save Component'}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
