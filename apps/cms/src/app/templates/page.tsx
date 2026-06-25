import { getAllComponentsForTemplates } from '@/actions';
import { getTemplates } from '@/actions/templates';
import { Suspense } from 'react';
import { TemplatesPage } from './TemplatesPage';

export default async function TemplatesRoute() {
  const templatesPromise = getTemplates();
  const componentsPromise = getAllComponentsForTemplates();

  return (
    <Suspense fallback={<div>Loading templates...</div>}>
      <TemplatesPage initialTemplates={templatesPromise} initialComponents={componentsPromise} />
    </Suspense>
  );
}
