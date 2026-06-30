import { getComponents } from '@/actions';
import { Suspense } from 'react';
import { ComponentsPage } from '../ComponentsPage';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ComponentWithSelectionPage({ params }: Props) {
  const { id } = await params;
  const userComponentsPromise = getComponents();

  return (
    <Suspense fallback={<div className="loading-components">Loading components...</div>}>
      <ComponentsPage initialComponents={userComponentsPromise} componentId={id} />
    </Suspense>
  );
}
