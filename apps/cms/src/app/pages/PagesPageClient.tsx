'use client';

import { createPage, deletePage, updatePage } from '@/actions';
import type { Component, Page, Template } from '@repo/ui';
import { Box, Button, Card, Flex, Text } from '@repo/ui';
import { use, useState } from 'react';
import { AddPageDialog } from './AddPageDialog';
import { PageBuilder } from './PageBuilder';
import styles from './PagesPage.module.scss';

type PagesPageClientProps = {
  initialPages: Promise<Page[]>;
  initialTemplates: Promise<Template[]>;
  initialComponents: Promise<Component[]>;
};

export default function PagesPageClient({ initialPages, initialTemplates, initialComponents }: PagesPageClientProps) {
  const initialPagesData = use(initialPages);
  const initialTemplatesData = use(initialTemplates);
  const initialComponentsData = use(initialComponents);

  const [pages, setPages] = useState<Page[]>(initialPagesData);
  const [templates] = useState<Template[]>(initialTemplatesData);
  const [components] = useState<Component[]>(initialComponentsData);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleNewPage = () => {
    setIsAddDialogOpen(true);
  };

  const handleCreatePage = async (name: string, description?: string, templateId?: string | null) => {
    try {
      // Convert null to undefined for the API call
      const apiTemplateId = templateId === null ? undefined : templateId;
      const newPage = await createPage(name, description, apiTemplateId);
      setPages((prev) => [...prev, newPage]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Failed to create page');
    }
  };

  const handleEditPage = (page: Page) => {
    setSelectedPage(page);
    // Find the template if page has templateId
    const template = page.templateId ? templates.find((t) => t.id === page.templateId) || null : null;
    setSelectedTemplate(template);
    setIsEditMode(true);
  };

  const handleSavePage = async (updatedPage: Page) => {
    try {
      const savedPage = await updatePage(updatedPage.id, updatedPage);
      setPages((prev) => prev.map((p) => (p.id === savedPage.id ? savedPage : p)));
      setSelectedPage(null);
      setSelectedTemplate(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      await deletePage(pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page');
    }
  };

  const handleCancelEdit = () => {
    setSelectedPage(null);
    setSelectedTemplate(null);
    setIsEditMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600';
      case 'draft':
        return 'text-yellow-600';
      case 'archived':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  // Show page builder if in edit mode
  if (isEditMode && selectedPage) {
    return (
      <PageBuilder
        page={selectedPage}
        components={components}
        selectedTemplate={selectedTemplate || undefined}
        onSave={handleSavePage}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <Box className="p-4">
      <Flex justify="between" align="center" className="mb-4">
        <div>
          <Text size="7" weight="bold">
            Pages
          </Text>
          <Text size="2" color="gray">
            Create and manage your content pages with template inheritance
          </Text>
        </div>
        <Button variant="primary" onClick={handleNewPage}>
          New Page
        </Button>
      </Flex>

      <Box>
        {pages.length === 0 ? (
          <div className="py-12 text-center">
            <Text color="gray" size="3" className="mb-4">
              No pages yet. Create your first page.
            </Text>
            <Button variant="primary" onClick={handleNewPage}>
              Create First Page
            </Button>
          </div>
        ) : (
          <div className={styles.pagesList}>
            {pages.map((page) => {
              const pageTemplate = page.templateId ? templates.find((t) => t.id === page.templateId) : null;
              const componentCount =
                page.zones?.reduce((count, zone) => count + zone.componentInstances.length, 0) || 0;

              return (
                <Card key={page.id} className={styles.pageCard}>
                  <div>
                    <Flex justify="between" align="start" className="mb-2">
                      <Text size="4" weight="medium">
                        {page.name}
                      </Text>
                      <span className={`text-sm font-medium ${getStatusColor(page.status || 'draft')}`}>
                        ● {page.status || 'draft'}
                      </span>
                    </Flex>

                    {page.description && (
                      <Text size="2" color="gray" className="mb-2">
                        {page.description}
                      </Text>
                    )}

                    <Text size="1" color="gray">
                      {componentCount} components
                      {pageTemplate && ` • Template: ${pageTemplate.name}`}
                      {page.metadata?.slug && ` • Slug: /${page.metadata.slug}`}
                    </Text>
                  </div>
                  <Flex gap="2" justify="end">
                    <Button size="sm" variant="primary-outline" onClick={() => handleEditPage(page)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="primary-outline" color="red" onClick={() => handleDeletePage(page.id)}>
                      Delete
                    </Button>
                  </Flex>
                </Card>
              );
            })}
          </div>
        )}
      </Box>

      {/* Add Page Dialog */}
      <AddPageDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleCreatePage}
        templates={templates}
      />
    </Box>
  );
}
