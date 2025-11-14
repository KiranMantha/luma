import { getAllComponentsForTemplates, getPages } from '@/actions';
import { getTemplates } from '@/actions/templates';
import { Suspense } from 'react';
import PagesPageClient from './PagesPageClient';

export default function PagesPage() {
  const pagesPromise = getPages();
  const templatesPromise = getTemplates();
  const componentsPromise = getAllComponentsForTemplates(); // Use all components for template-specific filtering in PageBuilder

  return (
    <Suspense fallback={<div>Loading pages...</div>}>
      <PagesPageClient
        initialPages={pagesPromise}
        initialTemplates={templatesPromise}
        initialComponents={componentsPromise}
      />
    </Suspense>
  );
}
