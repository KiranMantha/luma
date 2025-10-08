/**
 * Server actions for component management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { ControlInstance } from './controls';

export interface Component {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  type: 'primitive' | 'user-defined';
  isPrimitive?: boolean; // For backward compatibility
  controls?: ControlInstance[]; // Controls/fields within this component
}

// For now, we'll simulate localStorage on the server side
// In a real implementation, this would connect to a database
let componentsStore: Component[] = [];

export async function saveComponent(name: string, description?: string): Promise<Component> {
  const component: Component = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    type: 'user-defined',
    controls: [], // Start with empty controls array
  };

  // In a real app, this would save to database
  componentsStore.push(component);

  // Revalidate the page to show fresh data
  revalidatePath('/components');

  return component;
}

export async function getComponents(): Promise<Component[]> {
  // In a real app, this would fetch from database
  return componentsStore;
}

export async function deleteComponent(id: string): Promise<void> {
  const component = componentsStore.find((comp) => comp.id === id);

  // Prevent deletion of primitive components
  if (!component || component.type === 'primitive') {
    throw new Error('Cannot delete primitive components');
  }

  // In a real app, this would delete from database
  componentsStore = componentsStore.filter((comp) => comp.id !== id);

  // Revalidate the page to show fresh data
  revalidatePath('/components');
}

export async function updateComponent(id: string, name: string, description?: string): Promise<Component | null> {
  const componentIndex = componentsStore.findIndex((comp) => comp.id === id);

  if (componentIndex === -1) {
    return null;
  }

  const existingComponent = componentsStore[componentIndex];
  if (!existingComponent) {
    return null;
  }

  // Prevent editing of primitive components
  if (existingComponent.type === 'primitive') {
    throw new Error('Cannot edit primitive components');
  }

  const updatedComponent: Component = {
    id: existingComponent.id,
    name,
    description,
    createdAt: existingComponent.createdAt,
    type: existingComponent.type,
    controls: existingComponent.controls || [], // Preserve existing controls
  };

  componentsStore[componentIndex] = updatedComponent;

  // Revalidate the page to show fresh data
  revalidatePath('/components');

  return updatedComponent;
}
