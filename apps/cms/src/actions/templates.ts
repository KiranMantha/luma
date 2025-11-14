'use server';

import type { Template } from '@repo/ui';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

export async function getTemplates(): Promise<Template[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/templates`, { method: 'GET' });
    if (!res.ok) throw new Error(`Failed to fetch templates: ${res.statusText}`);
    const data = await res.json();

    // Ensure all templates have proper defaults (for backward compatibility)
    return data.map((template: Template) => ({
      ...template,
      zones: template.zones || [],
      metadata: template.metadata || {},
    }));
  } catch (err) {
    console.error('Error fetching templates:', err);
    return [];
  }
}

export async function saveTemplate(name: string, description?: string): Promise<Template> {
  try {
    // Import createDefaultZones at the top of the function to avoid ESM issues
    const { createDefaultZones } = await import('@repo/ui');

    const templateData = {
      name,
      description,
      layout: 'header-footer',
      zones: createDefaultZones('header-footer'),
      metadata: {},
    };

    const res = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });

    if (!res.ok) throw new Error(`Failed to create template: ${res.statusText}`);

    const result = await res.json();
    // Revalidate templates route
    revalidatePath('/templates');
    return result;
  } catch (err) {
    console.error('Error creating template:', err);
    throw err;
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete template: ${res.statusText}`);
    revalidatePath('/templates');
  } catch (err) {
    console.error('Error deleting template:', err);
    throw err;
  }
}

export async function updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
  try {
    // Create clean update object without timestamp fields that should be server-managed
    const cleanUpdates = {
      name: updates.name,
      description: updates.description,
      layout: updates.layout,
      zones: updates.zones,
      metadata: updates.metadata || {},
    };

    const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanUpdates),
    });
    if (!res.ok) throw new Error(`Failed to update template: ${res.statusText}`);
    const result = await res.json();
    revalidatePath('/templates');
    return result;
  } catch (err) {
    console.error('Error updating template:', err);
    throw err;
  }
}
export async function getTemplate(id: string): Promise<Template | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/templates/${id}`, { method: 'GET' });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch template: ${res.statusText}`);
    }
    const result = await res.json();

    // Ensure template has proper defaults (for backward compatibility)
    return {
      ...result,
      zones: result.zones || [],
      metadata: result.metadata || {},
    };
  } catch (err) {
    console.error('Error fetching template:', err);
    return null;
  }
}
