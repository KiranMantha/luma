import { Suspense } from 'react';
import PagesPageClient from './PagesPageClient';

export default function PagesPage() {
  return (
    <Suspense fallback={<div>Loading pages...</div>}>
      <PagesPageClient />
    </Suspense>
  );
}
