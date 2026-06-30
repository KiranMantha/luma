'use server';

import { revalidatePath } from 'next/cache';
import { setCachedPreviewUrl } from '@/lib/settingsCache';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

export type ProjectSettings = {
  previewUrl: string | null;
  projectName: string | null;
};

export async function getSettings(): Promise<ProjectSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch settings: ${response.statusText}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { previewUrl: null, projectName: null };
  }
}

export async function saveSettings(data: { previewUrl: string; projectName: string }): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to save settings: ${response.statusText}`);
  // Keep the in-process CORS cache in sync so the API route picks up the new origin immediately
  setCachedPreviewUrl(data.previewUrl || null);
  revalidatePath('/settings');
  revalidatePath('/pages');
}
