import { useEffect, useState } from 'react';
import { fetchPageBySlug, type PageModel } from '../lib/api';
import { LumaProvider, PageRenderer } from '../lib/luma-preview';

// Register all components — import triggers MapTo() side-effects
import '../lib/import-components';

export function PreviewPage() {
  const [page, setPage] = useState<PageModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = window.location.pathname.split('/').filter(Boolean).at(-1);
    if (!slug) {
      setError('No page slug in URL path');
      return;
    }
    fetchPageBySlug(slug)
      .then(setPage)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>Error: {error}</div>;
  if (!page) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading…</div>;

  return (
    <LumaProvider>
      <PageRenderer components={page.components} />
    </LumaProvider>
  );
}
