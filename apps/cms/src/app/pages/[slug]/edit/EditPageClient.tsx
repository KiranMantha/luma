'use client';

import { addComponentToPage, publishPage, saveDraft } from '@/actions/pages';
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
  const { previewUrl, projectName } = use(settingsPromise);

  const selectedTemplate = page.templateId ? templates.find((t) => t.id === page.templateId) ?? null : null;

  const handleSaveDraft = async (updatedPage: Page) => {
    return saveDraft(updatedPage.id, updatedPage.zones);
  };

  const handlePublishPage = async (pageId: string) => {
    return publishPage(pageId);
  };

  const handleCancel = () => {
    router.push('/pages');
  };

  return (
    <PageBuilder
      page={page}
      components={components}
      selectedTemplate={selectedTemplate ?? undefined}
      onSaveDraft={handleSaveDraft}
      onPublishPage={handlePublishPage}
      onCancel={handleCancel}
      previewUrl={previewUrl ?? undefined}
      projectName={projectName ?? undefined}
      onAddComponentToPage={addComponentToPage}
    />
  );
}
