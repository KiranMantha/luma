'use client';

import { Box, Button, Flex, Input, Modal } from '@repo/ui';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      <Box as="form" onSubmit={handleSubmit} className="space-y-4">
        <Box>
          <Input
            label="Component Name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter component name"
            required
          />
        </Box>
        <Box className="mb-4">
          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Enter component description"
          />
        </Box>
        <Flex justify="end" gap="3">
          <Button variant="ghost" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || loading}>
            {loading ? 'Updating...' : 'Update Component'}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
