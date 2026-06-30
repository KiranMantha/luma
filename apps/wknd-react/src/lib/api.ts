const CMS_BASE_URL = import.meta.env.VITE_CMS_BASE_URL || 'http://localhost:3001';

export type ComponentData = {
  id: string;
  componentId: string;
  type: string;
  name: string;
  order: number;
  [section: string]: unknown;
};

export type PageModel = {
  id: string;
  name: string;
  slug: string;
  components: ComponentData[];
};

export async function fetchPageBySlug(slug: string): Promise<PageModel> {
  const res = await fetch(`${CMS_BASE_URL}/pages/${slug}.model.json`);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
  return res.json();
}
