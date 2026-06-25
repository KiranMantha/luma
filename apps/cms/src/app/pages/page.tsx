import { getAllComponentsForTemplates, getPages } from '@/actions';
import { getTemplates } from '@/actions/templates';
import { Suspense } from 'react';
import { PagesPage } from './PagesPage';

export default function PagesRoute() {
  const pagesPromise = getPages();
  const templatesPromise = getTemplates();
  const componentsPromise = getAllComponentsForTemplates();

  return (
    <Suspense fallback={<div>Loading pages...</div>}>
      <PagesPage
        initialPages={pagesPromise}
        initialTemplates={templatesPromise}
        initialComponents={componentsPromise}
      />
    </Suspense>
  );
}
