'use client';

import { createContext, useContext, useState } from 'react';
import { AddComponentDialog } from './AddComponentDialog';
import { AddControlDialog } from './AddControlDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { EditComponentDialog } from './EditComponentDialog';
import type { Component, ControlInstance } from './models';
import { ControlType } from './ComponentPreview/ComponentPreview.model';

export type ComponentBuilderActions = {
  onSaveComponent: (name: string, description?: string) => Promise<unknown>;
  onUpdateComponent: (id: string, name: string, description?: string) => Promise<unknown>;
  onDeleteComponent: (componentId: string) => Promise<void>;
  onAddControl: (componentId: string, controlType: ControlType, label: string, config: Record<string, unknown>, order: number, sectionId?: string) => Promise<unknown>;
  onUpdateControl: (componentId: string, controlId: string, data: { controlType: ControlType; label: string; config: Record<string, unknown> }) => Promise<unknown>;
  onDeleteControl: (componentId: string, controlId: string) => Promise<void>;
  onAddSection: (componentId: string, sectionName: string) => Promise<{ id: string }>;
  onAddFieldset: (componentId: string, sectionId: string, name: string, description?: string, controls?: ControlInstance[]) => Promise<unknown>;
  onDeleteFieldset: (componentId: string, sectionId: string, fieldsetId: string) => Promise<void>;
  onUpdateFieldset: (componentId: string, sectionId: string, fieldsetId: string, name: string, description?: string, controls?: ControlInstance[]) => Promise<unknown>;
  onRefreshComponents: (currentComponentId?: string) => Promise<Component[]>;
};

export type ComponentBuilderContextValue = {
  components: Component[];
  selectedComponent: Component | null;
  activeTabId: string;
  pendingFieldsetControls: ControlInstance[];
  onSelectComponent: (component: Component) => void;
  onTriggerAddComponent: () => void;
  onTriggerEditComponent: (component: Component) => void;
  onTriggerDeleteComponent: (componentId: string) => void;
  onTriggerAddControl: (sectionId?: string) => void;
  onTriggerEditControl: (control: ControlInstance) => void;
  onTriggerDeleteControl: (controlId: string) => void;
  onAddSection: (sectionName: string) => void;
  onAddFieldset: (sectionId: string, name: string, description?: string, controls?: ControlInstance[]) => void;
  onDeleteFieldset: (fieldsetId: string) => void;
  onUpdateFieldset: (fieldsetId: string, name: string, description?: string, controls?: ControlInstance[]) => void;
  onRequestAddControlToFieldset: () => void;
  onActiveTabChange: (tabId: string) => void;
};

const ComponentBuilderContext = createContext<ComponentBuilderContextValue | null>(null);

export const useComponentBuilder = (): ComponentBuilderContextValue => {
  const ctx = useContext(ComponentBuilderContext);
  if (!ctx) {
    throw new Error('useComponentBuilder must be used within a ComponentBuilder');
  }
  return ctx;
};

export type ComponentBuilderProps = {
  components: Component[];
  actions: ComponentBuilderActions;
  children: React.ReactNode;
};

export const ComponentBuilder = ({ components: initialComponents, actions, children }: ComponentBuilderProps) => {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>('');

  const selectComponent = (component: Component) => {
    if (component.id !== selectedComponent?.id) {
      setActiveTabId('');
    }
    setSelectedComponent(component);
  };

  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isEditComponentOpen, setIsEditComponentOpen] = useState(false);
  const [isAddControlOpen, setIsAddControlOpen] = useState(false);
  const [isEditControlOpen, setIsEditControlOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [componentToEdit, setComponentToEdit] = useState<Component | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [controlToEdit, setControlToEdit] = useState<ControlInstance | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [isAddingControlToFieldset, setIsAddingControlToFieldset] = useState(false);
  const [pendingFieldsetControls, setPendingFieldsetControls] = useState<ControlInstance[]>([]);

  const refreshComponents = async (currentComponentId?: string) => {
    const allComponents = await actions.onRefreshComponents(currentComponentId);
    setComponents(allComponents);
    if (currentComponentId) {
      const updated = allComponents.find((c) => c.id === currentComponentId);
      if (updated) setSelectedComponent(updated);
    }
    return allComponents;
  };

  const handleSaveComponent = async (name: string, description?: string) => {
    await actions.onSaveComponent(name, description);
    const allComponents = await refreshComponents();
    const newest = allComponents[allComponents.length - 1];
    if (newest) {
      setSelectedComponent(newest);
      if (newest.sections?.[0]) setActiveTabId(newest.sections[0].id);
    }
  };

  const handleUpdateComponent = async (id: string, name: string, description?: string) => {
    await actions.onUpdateComponent(id, name, description);
    await refreshComponents(selectedComponent?.id);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    await actions.onDeleteComponent(componentToDelete.id);
    setComponents((prev) => prev.filter((c) => c.id !== componentToDelete.id));
    if (selectedComponent?.id === componentToDelete.id) {
      setSelectedComponent(null);
      setActiveTabId('');
    }
    setIsDeleteConfirmOpen(false);
    setComponentToDelete(null);
  };

  const handleAddControlToComponent = async (controlType: string, label: string, config: Record<string, unknown>) => {
    if (!selectedComponent) return;
    if (isAddingControlToFieldset) {
      const newControl: ControlInstance = {
        id: `ctrl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        controlType: controlType as ControlType,
        label: label || 'Untitled Control',
        config,
        order: pendingFieldsetControls.length,
      };
      setPendingFieldsetControls((prev) => [...prev, newControl]);
      setIsAddControlOpen(false);
      return;
    }
    let targetSection: string | undefined;
    if (selectedComponent.sections && selectedComponent.sections.length > 0) {
      targetSection = targetSectionId || selectedComponent.sections[0]?.id;
    }
    const totalControls = (selectedComponent.sections || []).reduce(
      (sum, s) => sum + s.controls.length,
      0,
    );
    await actions.onAddControl(
      selectedComponent.id,
      controlType as ControlType,
      label,
      config,
      totalControls + 1,
      targetSection,
    );
    await refreshComponents(selectedComponent.id);
    setTargetSectionId(null);
  };

  const handleUpdateControl = async (controlType: string, label: string, config: Record<string, unknown>) => {
    if (!selectedComponent || !controlToEdit) return;
    await actions.onUpdateControl(selectedComponent.id, controlToEdit.id, {
      controlType: controlType as ControlType,
      label,
      config,
    });
    await refreshComponents(selectedComponent.id);
  };

  const handleAddSection = async (sectionName: string) => {
    if (!selectedComponent) return;
    const newSection = await actions.onAddSection(selectedComponent.id, sectionName);
    await refreshComponents(selectedComponent.id);
    setActiveTabId(newSection.id);
  };

  const handleAddFieldset = async (sectionId: string, name: string, description?: string, controls?: ControlInstance[]) => {
    if (!selectedComponent) return;
    await actions.onAddFieldset(selectedComponent.id, sectionId, name, description, controls);
    await refreshComponents(selectedComponent.id);
    setPendingFieldsetControls([]);
  };

  const handleUpdateFieldset = async (fieldsetId: string, name: string, description?: string, controls?: ControlInstance[]) => {
    if (!selectedComponent) return;
    let sectionId = '';
    for (const section of selectedComponent.sections || []) {
      if (section.fieldsets?.some((f) => f.id === fieldsetId)) {
        sectionId = section.id;
        break;
      }
    }
    if (!sectionId) return;
    await actions.onUpdateFieldset(selectedComponent.id, sectionId, fieldsetId, name, description, controls);
    await refreshComponents(selectedComponent.id);
  };

  const handleDeleteFieldset = async (fieldsetId: string) => {
    if (!selectedComponent) return;
    let sectionId = '';
    for (const section of selectedComponent.sections || []) {
      if (section.fieldsets?.some((f) => f.id === fieldsetId)) {
        sectionId = section.id;
        break;
      }
    }
    if (!sectionId) return;
    await actions.onDeleteFieldset(selectedComponent.id, sectionId, fieldsetId);
    await refreshComponents(selectedComponent.id);
  };

  const handleDeleteControl = async (controlId: string) => {
    if (!selectedComponent) return;
    await actions.onDeleteControl(selectedComponent.id, controlId);
    await refreshComponents(selectedComponent.id);
  };

  const contextValue: ComponentBuilderContextValue = {
    components,
    selectedComponent,
    activeTabId,
    pendingFieldsetControls,
    onSelectComponent: selectComponent,
    onTriggerAddComponent: () => setIsAddComponentOpen(true),
    onTriggerEditComponent: (component) => {
      setComponentToEdit(component);
      setIsEditComponentOpen(true);
    },
    onTriggerDeleteComponent: (componentId) => {
      const component = components.find((c) => c.id === componentId);
      if (!component) return;
      setComponentToDelete(component);
      setIsDeleteConfirmOpen(true);
    },
    onTriggerAddControl: (sectionId) => {
      setTargetSectionId(sectionId || null);
      setIsAddingControlToFieldset(false);
      setPendingFieldsetControls([]);
      setIsAddControlOpen(true);
    },
    onTriggerEditControl: (control) => {
      setControlToEdit(control);
      setIsEditControlOpen(true);
    },
    onTriggerDeleteControl: handleDeleteControl,
    onAddSection: handleAddSection,
    onAddFieldset: handleAddFieldset,
    onDeleteFieldset: handleDeleteFieldset,
    onUpdateFieldset: handleUpdateFieldset,
    onRequestAddControlToFieldset: () => {
      setIsAddingControlToFieldset(true);
      setIsAddControlOpen(true);
    },
    onActiveTabChange: setActiveTabId,
  };

  return (
    <ComponentBuilderContext.Provider value={contextValue}>
      {children}

      <AddComponentDialog
        open={isAddComponentOpen}
        onOpenChange={setIsAddComponentOpen}
        onSave={handleSaveComponent}
      />
      <EditComponentDialog
        open={isEditComponentOpen}
        onOpenChange={setIsEditComponentOpen}
        onSave={handleUpdateComponent}
        component={componentToEdit}
      />
      <AddControlDialog
        open={isAddControlOpen}
        onOpenChange={(open) => {
          setIsAddControlOpen(open);
          if (!open) setIsAddingControlToFieldset(false);
        }}
        onAddControl={handleAddControlToComponent}
      />
      <AddControlDialog
        open={isEditControlOpen}
        onOpenChange={setIsEditControlOpen}
        onAddControl={handleUpdateControl}
        initialControl={controlToEdit}
        mode="edit"
      />
      <DeleteConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        componentName={componentToDelete?.name || ''}
      />
    </ComponentBuilderContext.Provider>
  );
};
