import { Suspense } from 'react';
import { getComponents } from './actions';
import { ComponentsPage as ComponentsPageClient } from './ComponentsPage';

export default async function ComponentsPage() {
  // Get user-created components from the server/database
  const userComponentsPromise = getComponents();

  // Pass the promise directly to the client component
  // This allows the page to render immediately while components load
  return (
    <Suspense fallback={<div className="loading-components">Loading components...</div>}>
      <ComponentsPageClient initialComponents={userComponentsPromise} />
    </Suspense>
  );
}
