'use client';

import type { Template } from '@repo/ui';
import { Box, Button, Flex, Input, Modal, Select } from '@repo/ui';
import { ChangeEvent, FormEvent, useState } from 'react';
import type { AddPageDialogProps } from './AddPageDialog.model';

interface AddPageDialogPropsWithTemplates extends AddPageDialogProps {
  templates: Template[];
}

// Helper function to convert page name to hyphen-separated identifier
const generatePageIdentifier = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const AddPageDialog = ({ open, onOpenChange, onSave, templates }: AddPageDialogPropsWithTemplates) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Auto-generate page identifier from name
  const pageIdentifier = generatePageIdentifier(name);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !pageIdentifier) return;

    setLoading(true);
    try {
      // Pass empty string as null for "No Template", otherwise pass the actual templateId
      const templateId = selectedTemplateId === '' ? null : selectedTemplateId;

      await onSave(name.trim(), pageIdentifier, description.trim() || undefined, templateId);
      setName('');
      setDescription('');
      setSelectedTemplateId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setSelectedTemplateId('');
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create New Page">
      <Box as="form" onSubmit={handleSubmit}>
        <Box className="mb-4">
          <Input
            label="Page Name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Enter page name"
            required
          />
        </Box>

        <Box className="mb-4">
          <Input
            label="Page Identifier"
            value={pageIdentifier}
            readOnly
            placeholder="auto-generated-from-page-name"
            hint={`API endpoint: ${pageIdentifier ? `${pageIdentifier}.model.json` : 'page-identifier.model.json'}`}
          />
        </Box>

        <Box className="mb-4">
          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="Enter page description"
          />
        </Box>

        <Box className="mb-4">
          {(() => {
            const selectOptions = [
              { label: 'No Template (Blank Page)', value: '' },
              ...templates.map((template) => ({
                label: template.name + (template.description ? ` - ${template.description}` : ''),
                value: template.id,
              })),
            ];

            return (
              <Select
                label="Template (Optional)"
                value={selectedTemplateId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedTemplateId(e.target.value)}
                options={selectOptions}
                hint={
                  selectedTemplateId
                    ? 'Page will inherit header/footer from selected template'
                    : 'Create a blank page with just a body content area'
                }
              />
            );
          })()}
        </Box>

        <Flex justify="end" gap="3">
          <Button variant="ghost" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || !pageIdentifier || loading}>
            {loading ? 'Creating...' : 'Create Page'}
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
