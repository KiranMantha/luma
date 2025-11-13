import { getAllComponentsForTemplates } from '@/actions';
import { getTemplates } from '@/actions/templates';
import { Suspense } from 'react';
import { TemplatesPageClient } from './TemplatesPageClient';

export default async function TemplatesPage() {
  const templatesPromise = getTemplates();
  const componentsPromise = getAllComponentsForTemplates();

  return (
    <Suspense fallback={<div>Loading templates...</div>}>
      {/* Pass server promises to client component */}
      <TemplatesPageClient initialTemplates={templatesPromise} initialComponents={componentsPromise} />
    </Suspense>
  );
}
