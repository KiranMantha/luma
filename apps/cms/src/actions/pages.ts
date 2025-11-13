/**
 * Server actions for page management
 */

'use server';

import type { Page, Template } from '@repo/ui';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

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

export async function getPageById(id: string): Promise<Page | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch page: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function createPage(
  name: string,
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

export async function publishPage(id: string): Promise<Page> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pages/${id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to publish page: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/pages');

    return result;
  } catch (error) {
    console.error('Error publishing page:', error);
    throw new Error('Failed to publish page');
  }
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
