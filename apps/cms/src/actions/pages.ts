/**
 * Server actions for page management
 */

'use server';

import type { Page, Template } from '@repo/ui';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL;

export async function getPages(): Promise<Page[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export async function getPageForEdit(slug: string): Promise<Page | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/edit/${slug}`, { cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching page for edit:', error);
    return null;
  }
}

export async function createPage(
  name: string,
  slug: string,
  description?: string,
  templateId?: string,
  folderId?: string,
): Promise<Page> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        slug,
        description,
        templateId,
        folderId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create page: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/pages');

    return result;
  } catch (error) {
    console.error('Error creating page:', error);
    throw new Error('Failed to create page');
  }
}
export async function updatePage(id: string, updates: Partial<Page>): Promise<Page> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update page: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/pages');

    return result;
  } catch (error) {
    console.error('Error updating page:', error);
    throw new Error('Failed to update page');
  }
}

export async function deletePage(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete page: ${response.statusText}`);
    }

    // Revalidate the page to show fresh data
    revalidatePath('/pages');
  } catch (error) {
    console.error('Error deleting page:', error);
    throw new Error('Failed to delete page');
  }
}

export async function saveDraft(id: string, zones: Page['zones'], metadata?: Record<string, unknown>): Promise<Page> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${id}/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zones, metadata }),
  });
  if (!response.ok) throw new Error(`Failed to save draft: ${response.statusText}`);
  revalidatePath('/pages');
  return response.json();
}

export async function publishPage(id: string): Promise<Page> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to publish page: ${response.statusText}`);
    }

    const result = await response.json();
    revalidatePath('/pages');
    return result;
  } catch (error) {
    console.error('Error publishing page:', error);
    throw new Error('Failed to publish page');
  }
}

export type PageModelPayload = {
  pageId: string;
  slug: string;
  zones: Array<{ id: string; name: string; type: string; order: number; maxComponents: number | null; locked: boolean }>;
  components: Array<{ id: string; componentId: string; type: string; zoneId: string; order: number; config: Record<string, unknown> }>;
};

export async function addComponentToPage(
  pageId: string,
  componentId: string,
  zoneId: string,
  afterIndex: number | null,
): Promise<PageModelPayload> {
  const response = await fetch(`${API_BASE_URL}/api/pages/${pageId}/instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ componentId, zoneId, afterIndex }),
  });
  if (!response.ok) throw new Error(`Failed to add component: ${response.statusText}`);
  return response.json();
}

// Utility function to get components used in a specific template
export async function getComponentsUsedInTemplate(templateId: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const template: Template = await response.json();
    const usedComponentIds: string[] = [];

    if (template.zones) {
      template.zones.forEach((zone) => {
        if (zone.componentInstances) {
          zone.componentInstances.forEach((instance) => {
            if (instance.componentId && !usedComponentIds.includes(instance.componentId)) {
              usedComponentIds.push(instance.componentId);
            }
          });
        }
      });
    }

    return usedComponentIds;
  } catch (error) {
    console.error('Error getting components used in template:', error);
    return [];
  }
}
