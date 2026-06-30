import { getAllComponentsForTemplates, getPages } from '@/actions';
import { getSettings } from '@/actions/settings';
import { getTemplates } from '@/actions/templates';
import { Suspense } from 'react';
import { PagesPage } from './PagesPage';

export default function PagesRoute() {
  const pagesPromise = getPages();
  const templatesPromise = getTemplates();
  const componentsPromise = getAllComponentsForTemplates();
  const settingsPromise = getSettings();

  return (
    <Suspense fallback={<div>Loading pages...</div>}>
      <PagesPage
        initialPages={pagesPromise}
        initialTemplates={templatesPromise}
        initialComponents={componentsPromise}
        initialSettings={settingsPromise}
      />
    </Suspense>
  );
}
