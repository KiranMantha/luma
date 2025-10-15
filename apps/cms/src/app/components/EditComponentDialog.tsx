'use client';

import { Box, Flex } from '@radix-ui/themes';
import { Button, Input, Modal } from '@repo/ui';
import { ChangeEvent, useEffect, useState } from 'react';
import type { EditComponentDialogProps } from './EditComponentDialog.model';

export const EditComponentDialog = ({ open, onOpenChange, onSave, component }: EditComponentDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (component) {
      setName(component.name);
      setDescription(component.description || '');
    }
  }, [component]);

  const handleSave = async () => {
    if (!name.trim() || !component) return;

    setLoading(true);
    try {
      await onSave(component.id, name.trim(), description.trim() || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update component:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (component) {
      setName(component.name);
      setDescription(component.description || '');
    }
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Edit Component">
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
            {loading ? 'Updating...' : 'Update Component'}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
