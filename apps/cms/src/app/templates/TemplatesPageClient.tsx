'use client';

import { deleteTemplate, saveTemplate } from '@/actions';
import type { Component, Template } from '@repo/ui';
import { Box, Button, Card, Flex, Text } from '@repo/ui';
import { use, useState } from 'react';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { AddTemplateDialog } from './AddTemplateDialog';
import { TemplateBuilder } from './TemplateBuilder';
import styles from './TemplatesPage.module.scss';

type Props = {
  initialTemplates: Promise<Template[]>;
  initialComponents: Promise<Component[]>;
};

export const TemplatesPageClient = ({ initialTemplates, initialComponents }: Props) => {
  const initial = use(initialTemplates);
  const components = use(initialComponents);
  const [templates, setTemplates] = useState<Template[]>(initial || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const handleOpenAdd = () => setIsDialogOpen(true);
  const handleSave = async (name: string, description?: string) => {
    const created = await saveTemplate(name, description);
    setTemplates((p) => [...p, created]);
  };

  const confirmDelete = (t: Template) => {
    setToDelete(t);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    await deleteTemplate(toDelete.id);
    setTemplates((p) => p.filter((x) => x.id !== toDelete.id));
    setToDelete(null);
    setIsDeleteOpen(false);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleSaveTemplate = async (updatedTemplate: Template) => {
    try {
      // Send the complete template update in one API call
      const response = await fetch(`http://localhost:3002/api/templates/${updatedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update template: ${response.statusText} - ${errorText}`);
      }

      const saved = await response.json();
      setTemplates((p) => p.map((t) => (t.id === saved.id ? saved : t)));
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : error}`);
    }
  };
  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  // Show template builder if editing
  if (editingTemplate) {
    return (
      <TemplateBuilder
        template={editingTemplate}
        components={components}
        onSave={handleSaveTemplate}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <Box className="p-4">
      <Flex justify="between" align="center" className="mb-4">
        <div>
          <Text size="7" weight="bold">
            Templates
          </Text>
          <Text size="2" color="gray">
            Zone-based template builder
          </Text>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          New Template
        </Button>
      </Flex>

      <Box>
        {templates.length === 0 ? (
          <Text color="gray">No templates yet. Create your first template.</Text>
        ) : (
          <div className={styles.list}>
            {templates.map((template) => (
              <Card key={template.id} className={styles.card}>
                <Text size="4" weight="medium">
                  {template.name}
                </Text>
                {template.description && (
                  <Text size="2" color="gray" className="mt-1">
                    {template.description}
                  </Text>
                )}
                <Flex gap="2" justify="end">
                  <Button size="sm" variant="primary-outline" onClick={() => handleEditTemplate(template)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="primary-outline" color="red" onClick={() => confirmDelete(template)}>
                    Delete
                  </Button>
                </Flex>
              </Card>
            ))}
          </div>
        )}
      </Box>

      <AddTemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSave} />
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        componentName={toDelete?.name || ''}
        itemType="template"
      />
    </Box>
  );
};
