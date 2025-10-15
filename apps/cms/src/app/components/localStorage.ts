/**
 * Utility functions for localStorage interaction
 */

import { Component, ComponentType } from '@repo/ui';

export const loadComponentsFromLocalStorage = (): Component[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem('components');
    const components = stored ? JSON.parse(stored) : [];

    // Ensure backward compatibility and filter out primitive components
    // (primitive components should not be stored in localStorage)
    return components.filter((comp: Component) => comp.type === ComponentType.USER_DEFINED);
  } catch (error) {
    console.error('Error loading components from localStorage:', error);
    return [];
  }
};

export const saveComponentsToLocalStorage = (components: Component[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Only save user-defined components to localStorage
    const userDefinedComponents = components.filter((comp) => comp.type === ComponentType.USER_DEFINED);
    localStorage.setItem('components', JSON.stringify(userDefinedComponents));
  } catch (error) {
    console.error('Error saving components to localStorage:', error);
  }
};

export const syncComponentWithLocalStorage = (component: Component): void => {
  // Don't save primitive components to localStorage
  if (component.type === ComponentType.PRIMITIVE) {
    return;
  }

  const existing = loadComponentsFromLocalStorage();
  const componentIndex = existing.findIndex((c) => c.id === component.id);

  if (componentIndex >= 0) {
    existing[componentIndex] = component;
  } else {
    existing.push(component);
  }

  saveComponentsToLocalStorage(existing);
};

export const removeComponentFromLocalStorage = (componentId: string): void => {
  const existing = loadComponentsFromLocalStorage();
  const filtered = existing.filter((c) => c.id !== componentId);
  saveComponentsToLocalStorage(filtered);
};
