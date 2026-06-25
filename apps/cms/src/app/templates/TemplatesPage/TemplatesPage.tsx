'use client';

import { deleteTemplate, saveTemplate, updateTemplate } from '@/actions';
import type { Component, Template } from '@repo/ui';
import { Box, Button, Card, DeleteConfirmDialog, Flex, TemplateBuilder, Text } from '@repo/ui';
import { use, useState } from 'react';
import { AddTemplateDialog } from './AddTemplateDialog';
import styles from './TemplatesPage.module.scss';

type TemplatesPageProps = {
  initialTemplates: Promise<Template[]>;
  initialComponents: Promise<Component[]>;
};

export const TemplatesPage = ({ initialTemplates, initialComponents }: TemplatesPageProps) => {
  const initial = use(initialTemplates);
  const components = use(initialComponents);
  const [templates, setTemplates] = useState<Template[]>(initial || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

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

  const handleSaveTemplate = async (updatedTemplate: Template) => {
    try {
      const saved = await updateTemplate(updatedTemplate.id, updatedTemplate);
      setTemplates((p) => p.map((t) => (t.id === saved.id ? saved : t)));
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : error}`);
    }
  };

  if (editingTemplate) {
    return (
      <TemplateBuilder
        template={editingTemplate}
        components={components}
        onSave={handleSaveTemplate}
        onCancel={() => setEditingTemplate(null)}
      />
    );
  }

  return (
    <Box className="p-4">
      <Flex justify="between" align="center" className="mb-4">
        <div>
          <Text size="7" weight="bold">Templates</Text>
          <Text size="2" color="gray">Zone-based template builder</Text>
        </div>
        <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
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
                <Text size="4" weight="medium">{template.name}</Text>
                {template.description && (
                  <Text size="2" color="gray" className="mt-1">{template.description}</Text>
                )}
                <Flex gap="2" justify="end">
                  <Button size="sm" variant="primary-outline" onClick={() => setEditingTemplate(template)}>
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
