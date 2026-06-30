import { getAllComponentsForTemplates } from '@/actions';
import { getPageForEdit } from '@/actions/pages';
import { getSettings } from '@/actions/settings';
import { getTemplates } from '@/actions/templates';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EditPageClient } from './EditPageClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPageForEdit(slug);

  if (!page) notFound();

  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading editor…</div>}>
      <EditPageClient
        pagePromise={Promise.resolve(page)}
        componentsPromise={getAllComponentsForTemplates()}
        templatesPromise={getTemplates()}
        settingsPromise={getSettings()}
      />
    </Suspense>
  );
}
