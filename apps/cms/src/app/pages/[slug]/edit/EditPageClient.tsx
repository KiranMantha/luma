'use client';

import { updatePage } from '@/actions';
import type { ProjectSettings } from '@/actions/settings';
import type { Component, Page, Template } from '@repo/ui';
import { PageBuilder } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { use } from 'react';

type Props = {
  pagePromise: Promise<Page>;
  componentsPromise: Promise<Component[]>;
  templatesPromise: Promise<Template[]>;
  settingsPromise: Promise<ProjectSettings>;
};

export function EditPageClient({ pagePromise, componentsPromise, templatesPromise, settingsPromise }: Props) {
  const router = useRouter();
  const page = use(pagePromise);
  const components = use(componentsPromise);
  const templates = use(templatesPromise);
  const { previewUrl } = use(settingsPromise);

  const selectedTemplate = page.templateId ? templates.find((t) => t.id === page.templateId) ?? null : null;

  const handleSave = async (updatedPage: Page) => {
    await updatePage(updatedPage.id, updatedPage);
    router.push('/pages');
  };

  const handleCancel = () => {
    router.push('/pages');
  };

  return (
    <PageBuilder
      page={page}
      components={components}
      selectedTemplate={selectedTemplate ?? undefined}
      onSave={handleSave}
      onCancel={handleCancel}
      previewUrl={previewUrl ?? undefined}
    />
  );
}
