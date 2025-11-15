import { Box, Button, Flex, Input, Text } from '#atoms';
import { Modal } from '#molecules';
import { FormEvent, useState } from 'react';

export type AddSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSection: (sectionName: string) => void;
};

export const AddSectionDialog = ({ open, onOpenChange, onAddSection }: AddSectionDialogProps) => {
  const [sectionName, setSectionName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = sectionName.trim();

    if (!trimmedName) {
      setError('Section name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Section name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Section name must be less than 50 characters');
      return;
    }

    onAddSection(trimmedName);
    setSectionName('');
    setError('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSectionName('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add New Section">
      <Box as="form" onSubmit={handleSubmit} className="space-y-4">
        <Box>
          <Text size="3" className="mb-2">
            Enter a name for the new section:
          </Text>
          <Input
            type="text"
            value={sectionName}
            onChange={(e) => {
              setSectionName(e.target.value);
              if (error) setError(''); // Clear error on change
            }}
            placeholder="e.g., Header, Content, Footer"
            autoFocus
            error={error}
          />
          {error && (
            <Text size="2" className="mt-1 text-red-600">
              {error}
            </Text>
          )}
        </Box>

        <Box>
          <Text size="2" className="text-gray-600">
            Sections organize your component into logical groups. You can add repeatable structures within sections
            later.
          </Text>
        </Box>

        <Flex gap="3" justify="end">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!sectionName.trim()}>
            Add Section
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
