'use client';

import { createContext, useContext } from 'react';
import type { Component, ControlInstance, Fieldset } from './models';

export type ComponentBuilderContextValue = {
  components: Component[];
  selectedComponent: Component | null;
  activeTabId: string;
  onSelectComponent: (component: Component) => void;
  onAddComponent: () => void;
  onEditComponent: (component: Component) => void;
  onDeleteComponent: (componentId: string) => void;
  onAddControl: (sectionId?: string) => void;
  onEditControl: (control: ControlInstance) => void;
  onDeleteControl: (controlId: string) => void;
  onAddSection: (sectionName: string) => void;
  onAddFieldset: (sectionId: string, name: string, description?: string, controls?: ControlInstance[]) => void;
  onDeleteFieldset: (fieldsetId: string) => void;
  onUpdateFieldset: (fieldsetId: string, name: string, description?: string, controls?: ControlInstance[]) => void;
  pendingFieldsetControls: ControlInstance[];
  onRequestAddControlToFieldset: () => void;
  onActiveTabChange: (tabId: string) => void;
};

const ComponentBuilderContext = createContext<ComponentBuilderContextValue | null>(null);

export const ComponentBuilderProvider = ComponentBuilderContext.Provider;

export const useComponentBuilder = (): ComponentBuilderContextValue => {
  const ctx = useContext(ComponentBuilderContext);
  if (!ctx) {
    throw new Error('useComponentBuilder must be used within a ComponentBuilderProvider');
  }
  return ctx;
};
