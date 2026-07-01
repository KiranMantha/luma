import { useEffect, useState } from 'react';
import { fetchPageBySlug, type PageModel } from '../lib/api';
import '../lib/import-components';
import { LumaProvider, PageRenderer, useLumaMode } from '../lib/luma-preview';

function PreviewPageInner() {
  const mode = useLumaMode();
  const [page, setPage] = useState<PageModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In edit mode the CMS pushes the full page model via postMessage — no API call needed.
    if (mode === 'edit') return;

    const slug = window.location.pathname.split('/').filter(Boolean).at(-1);
    if (!slug) {
      setError('No page slug in URL path');
      return;
    }
    fetchPageBySlug(slug)
      .then(setPage)
      .catch((err) => setError(err.message));
  }, [mode]);

  if (mode === 'edit') {
    // Render immediately with empty state; PageRenderer repaints when CMS sends pageModel event.
    return <PageRenderer components={[]} />;
  }

  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>Error: {error}</div>;
  if (!page) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading…</div>;

  return <PageRenderer components={page.components} />;
}

export function PreviewPage() {
  return (
    <LumaProvider>
      <PreviewPageInner />
    </LumaProvider>
  );
}
