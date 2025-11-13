'use client';

import { Box, Button, Flex, Input, Modal } from '@repo/ui';
import { ChangeEvent, FormEvent, useState } from 'react';

type AddTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => Promise<void>;
};

export const AddTemplateDialog = ({ open, onOpenChange, onSave }: AddTemplateDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save template:', err);
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
    <Modal open={open} onOpenChange={onOpenChange} title="Add New Template">
      <Box as="form" onSubmit={handleSubmit}>
        <Box className="mb-4">
          <Input
            label="Template Name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter template name"
            required
          />
        </Box>
        <Box className="mb-4">
          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Enter template description"
          />
        </Box>
        <Flex justify="end" gap="3">
          <Button variant="ghost" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
