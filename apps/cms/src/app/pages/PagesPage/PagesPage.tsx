'use client';

import { createPage, deletePage } from '@/actions';
import type { ProjectSettings } from '@/actions/settings';
import type { Component, Page, Template } from '@repo/ui';
import { Box, Button, Card, Flex, Text } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { AddPageDialog } from './AddPageDialog';
import styles from './PagesPage.module.scss';

type PagesPageProps = {
  initialPages: Promise<Page[]>;
  initialTemplates: Promise<Template[]>;
  initialComponents: Promise<Component[]>;
  initialSettings: Promise<ProjectSettings>;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'text-green-600';
    case 'draft': return 'text-yellow-600';
    case 'archived': return 'text-gray-500';
    default: return 'text-gray-600';
  }
};

export const PagesPage = ({ initialPages, initialTemplates, initialComponents, initialSettings }: PagesPageProps) => {
  const router = useRouter();
  const initialPagesData = use(initialPages);
  const initialTemplatesData = use(initialTemplates);
  // initialComponents and initialSettings are unused here now — edit route fetches fresh
  use(initialComponents);
  use(initialSettings);

  const [pages, setPages] = useState<Page[]>(initialPagesData);
  const [templates] = useState<Template[]>(initialTemplatesData);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleCreatePage = async (
    name: string,
    slug: string,
    description?: string,
    templateId?: string | null,
  ) => {
    try {
      const apiTemplateId = templateId === null ? undefined : templateId;
      const newPage = await createPage(name, slug, description, apiTemplateId);
      setPages((prev) => [...prev, newPage]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Failed to create page');
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

  return (
    <Box className="p-4">
      <Flex justify="between" align="center" className="mb-4">
        <div>
          <Text size="7" weight="bold">Pages</Text>
          <Text size="2" color="gray">Create and manage your content pages with template inheritance</Text>
        </div>
        <Button variant="primary" onClick={() => setIsAddDialogOpen(true)}>
          New Page
        </Button>
      </Flex>

      <Box className={styles.pagesList}>
        {pages.map((page) => {
          const pageTemplate = page.templateId ? templates.find((t) => t.id === page.templateId) : null;
          const componentCount = page.zones?.reduce((count, zone) => count + zone.componentInstances.length, 0) || 0;

          return (
            <Card key={page.id} className={styles.pageCard}>
              <div>
                <Flex justify="between" align="start" className="mb-2">
                  <Text size="4" weight="medium">{page.name}</Text>
                  <span className={`text-sm font-medium ${getStatusColor(page.status || 'draft')}`}>
                    ● {page.status || 'draft'}
                  </span>
                </Flex>
                {page.description && (
                  <Text size="2" color="gray" className="mb-2">{page.description}</Text>
                )}
                <Text size="1" color="gray">
                  {componentCount} components
                  {pageTemplate && ` • Template: ${pageTemplate.name}`}
                  {page.slug && ` • Slug: /${page.slug}`}
                </Text>
              </div>
              <Flex gap="2" justify="end">
                <Button size="sm" variant="primary-outline" onClick={() => router.push(`/pages/${page.slug}/edit`)}>
                  Edit
                </Button>
                <Button size="sm" variant="primary-outline" color="red" onClick={() => handleDeletePage(page.id)}>
                  Delete
                </Button>
              </Flex>
            </Card>
          );
        })}
      </Box>

      <AddPageDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleCreatePage}
        templates={templates}
      />
    </Box>
  );
};
