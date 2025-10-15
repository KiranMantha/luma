/**
 * Server actions for component management
 */

'use server';

import { ComponentType, type Component, type ControlInstance } from '@repo/ui';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

export async function saveComponent(name: string, description?: string): Promise<Component> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        type: ComponentType.USER_DEFINED,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save component: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error saving component:', error);
    throw new Error('Failed to save component');
  }
}

export async function getComponents(): Promise<Component[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch components: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching components:', error);
    return [];
  }
}

export async function deleteComponent(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete component: ${response.statusText}`);
    }

    // Revalidate the page to show fresh data
    revalidatePath('/components');
  } catch (error) {
    console.error('Error deleting component:', error);
    throw new Error('Failed to delete component');
  }
}

export async function updateComponent(id: string, updates: Partial<Component>): Promise<Component> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update component: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error updating component:', error);
    throw new Error('Failed to update component');
  }
}

export async function addControlToComponent(
  componentId: string,
  controlType: string,
  label: string,
  config: Record<string, unknown>,
  orderIndex: number,
): Promise<ControlInstance> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/controls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        controlType,
        label,
        config,
        orderIndex,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add control: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error adding control:', error);
    throw new Error('Failed to add control');
  }
}

export async function updateControl(
  componentId: string,
  controlId: string,
  updates: Partial<ControlInstance>,
): Promise<ControlInstance> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/controls/${controlId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        controlType: updates.controlType,
        label: updates.label,
        config: updates.config,
        orderIndex: updates.order,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update control: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error updating control:', error);
    throw new Error('Failed to update control');
  }
}

export async function deleteControl(componentId: string, controlId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/controls/${controlId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete control: ${response.statusText}`);
    }

    // Revalidate the page to show fresh data
    revalidatePath('/components');
  } catch (error) {
    console.error('Error deleting control:', error);
    throw new Error('Failed to delete control');
  }
}
