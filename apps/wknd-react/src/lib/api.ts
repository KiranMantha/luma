const CMS_BASE_URL = import.meta.env.VITE_CMS_BASE_URL || 'http://localhost:3001';

// Zone policy info returned by the API
export type ZoneInfo = {
  id: string;
  name: string;
  type: string;
  order: number;
  maxComponents: number | null;
  locked: boolean;
};

// A component instance placed on the page
export type ComponentData = {
  id: string;           // instance ID (stable, used for postMessage events)
  componentId: string;  // component definition ID (CMS side)
  type: string;         // MapTo registry key (e.g. "wknd/components/hero")
  zoneId: string;       // which zone this instance lives in
  order: number;
  config: Record<string, unknown>; // resolved authored content (section → { field: value })
};

export type PageModel = {
  id: string;
  name: string;
  slug: string;
  status: string;
  components: ComponentData[];
};

export async function fetchPageBySlug(slug: string): Promise<PageModel> {
  const res = await fetch(`${CMS_BASE_URL}/pages/${slug}.model.json`);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
  return res.json();
}
