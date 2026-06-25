'use client';

import {
  addControlToComponent,
  addFieldsetToSection,
  addSectionToComponent,
  deleteComponent,
  deleteControl,
  deleteFieldsetFromSection,
  getComponents,
  saveComponent,
  updateComponent,
  updateControl,
  updateFieldsetInSection,
} from '@/actions';
import {
  Component,
  ComponentBuilderProvider,
  ComponentLibrary,
  ComponentPreview,
  ComponentType,
  ControlInstance,
  ControlType,
  getTotalControlsCount,
} from '@repo/ui';
import { use, useState } from 'react';
import { AddComponentDialog } from '../AddComponentDialog';
import { AddControlDialog } from '../AddControlDialog';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { EditComponentDialog } from '../EditComponentDialog';
import type { ComponentsPageProps } from './ComponentsPage.model';
import styles from './ComponentsPage.module.scss';

export const ComponentsPage = ({ initialComponents }: ComponentsPageProps) => {
  const initialComponentsData = use(initialComponents);
  const [components, setComponents] = useState<Component[]>(initialComponentsData);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddControlDialogOpen, setIsAddControlDialogOpen] = useState(false);
  const [isEditControlDialogOpen, setIsEditControlDialogOpen] = useState(false);
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<Component | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [controlToEdit, setControlToEdit] = useState<ControlInstance | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Tracks controls being added to a new fieldset before it's saved
  const [isAddingControlToFieldset, setIsAddingControlToFieldset] = useState(false);
  const [pendingFieldsetControls, setPendingFieldsetControls] = useState<ControlInstance[]>([]);

  const refreshComponents = async (currentComponentId?: string) => {
    const allComponents = await getComponents();
    setComponents(allComponents);
    if (currentComponentId) {
      const updated = allComponents.find((c: Component) => c.id === currentComponentId);
      if (updated) setSelectedComponent(updated);
    }
    return allComponents;
  };

  const handleAddControlToNewFieldset = async (controlType: ControlType, config: unknown) => {
    if (!isAddingControlToFieldset) return;
    const configObj = config as Record<string, unknown>;
    const newControl: ControlInstance = {
      id: `ctrl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      controlType,
      label: (configObj.label as string) || 'Untitled Control',
      config: configObj,
      order: pendingFieldsetControls.length,
    };
    setPendingFieldsetControls((prev) => [...prev, newControl]);
    setIsAddControlDialogOpen(false);
  };

  const handleRequestAddControlToFieldset = () => {
    setIsAddingControlToFieldset(true);
    setIsAddControlDialogOpen(true);
  };

  const handleAddControl = (sectionId?: string) => {
    if (!selectedComponent) return;
    setTargetSectionId(sectionId || null);
    setIsAddingControlToFieldset(false);
    setPendingFieldsetControls([]);
    setIsAddControlDialogOpen(true);
  };

  const handleEditControl = (control: ControlInstance) => {
    setControlToEdit(control);
    setIsEditControlDialogOpen(true);
  };

  const handleUpdateControlInComponent = async (controlType: ControlType, config: unknown) => {
    if (!selectedComponent || !controlToEdit) return;
    try {
      setError(null);
      await updateControl(selectedComponent.id, controlToEdit.id, {
        controlType,
        config: config as Record<string, unknown>,
      });
      await refreshComponents(selectedComponent.id);
    } catch {
      setError('Failed to update control');
    }
  };

  const handleDeleteControl = async (controlId: string) => {
    if (!selectedComponent) return;
    try {
      setError(null);
      await deleteControl(selectedComponent.id, controlId);
      await refreshComponents(selectedComponent.id);
    } catch {
      setError('Failed to delete control');
    }
  };

  const handleAddControlToComponent = async (controlType: ControlType, config: unknown) => {
    if (!selectedComponent) return;
    try {
      setError(null);
      let targetSection: string | undefined;
      if (selectedComponent.sections && selectedComponent.sections.length > 0) {
        targetSection = targetSectionId || selectedComponent.sections[0]?.id;
      }
      const configObj = config as Record<string, unknown>;
      const label = (configObj.label as string) || '';
      const { label: _label, ...configWithoutLabel } = configObj;
      await addControlToComponent(
        selectedComponent.id,
        controlType,
        label,
        configWithoutLabel,
        getTotalControlsCount(selectedComponent.sections || []) + 1,
        targetSection,
      );
      await refreshComponents(selectedComponent.id);
      setTargetSectionId(null);
    } catch {
      setError('Failed to add control to component');
    }
  };

  const handleSaveComponent = async (name: string, description?: string) => {
    const newComponent = await saveComponent(name, description);
    setComponents((prev) => [...prev, newComponent]);
    setSelectedComponent(newComponent);
    if (newComponent.sections?.[0]) {
      setActiveTabId(newComponent.sections[0].id);
    }
  };

  const handleEditComponent = (component: Component) => {
    if (component.type !== ComponentType.USER_DEFINED) return;
    setComponentToEdit(component);
    setIsEditDialogOpen(true);
  };

  const handleUpdateComponent = async (id: string, name: string, description?: string) => {
    try {
      const updatedComponent = await updateComponent(id, { name, description });
      if (updatedComponent) {
        setComponents((prev) => prev.map((c) => (c.id === id ? updatedComponent : c)));
      }
    } catch {
      setError('Failed to update component');
    }
  };

  const handleDeleteComponent = (componentId: string) => {
    const component = components.find((c) => c.id === componentId);
    if (!component || component.type !== ComponentType.USER_DEFINED) return;
    setComponentToDelete(component);
    setIsDeleteConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    try {
      await deleteComponent(componentToDelete.id);
      setComponents((prev) => prev.filter((c) => c.id !== componentToDelete.id));
      if (selectedComponent?.id === componentToDelete.id) {
        setSelectedComponent(null);
        setActiveTabId('');
      }
      setIsDeleteConfirmDialogOpen(false);
      setComponentToDelete(null);
    } catch {
      setError('Failed to delete component');
    }
  };

  const handleAddSection = async (sectionName: string) => {
    if (!selectedComponent) return;
    try {
      setError(null);
      const newSection = await addSectionToComponent(selectedComponent.id, sectionName);
      await refreshComponents(selectedComponent.id);
      setActiveTabId(newSection.id);
    } catch {
      setError('Failed to add section to component');
    }
  };

  const handleAddFieldset = async (
    sectionId: string,
    name: string,
    description?: string,
    controls?: ControlInstance[],
  ) => {
    if (!selectedComponent) return;
    try {
      setError(null);
      await addFieldsetToSection(selectedComponent.id, sectionId, name, description, controls);
      await refreshComponents(selectedComponent.id);
      setPendingFieldsetControls([]);
    } catch {
      setError('Failed to add fieldset');
    }
  };

  const handleUpdateFieldset = async (
    fieldsetId: string,
    name: string,
    description?: string,
    controls?: ControlInstance[],
  ) => {
    if (!selectedComponent) return;
    try {
      setError(null);
      let sectionId = '';
      for (const section of selectedComponent.sections || []) {
        if (section.fieldsets?.some((f) => f.id === fieldsetId)) {
          sectionId = section.id;
          break;
        }
      }
      if (!sectionId) throw new Error('Could not find section for fieldset');
      await updateFieldsetInSection(selectedComponent.id, sectionId, fieldsetId, name, description, controls);
      await refreshComponents(selectedComponent.id);
    } catch {
      setError('Failed to update fieldset');
    }
  };

  const handleDeleteFieldset = async (fieldsetId: string) => {
    if (!selectedComponent) return;
    try {
      setError(null);
      let sectionId = '';
      for (const section of selectedComponent.sections || []) {
        if (section.fieldsets?.some((f) => f.id === fieldsetId)) {
          sectionId = section.id;
          break;
        }
      }
      if (!sectionId) throw new Error('Could not find section for fieldset');
      await deleteFieldsetFromSection(selectedComponent.id, sectionId, fieldsetId);
      await refreshComponents(selectedComponent.id);
    } catch {
      setError('Failed to delete fieldset');
    }
  };

  return (
    <ComponentBuilderProvider
      value={{
        components,
        selectedComponent,
        activeTabId,
        onSelectComponent: setSelectedComponent,
        onAddComponent: () => setIsDialogOpen(true),
        onEditComponent: handleEditComponent,
        onDeleteComponent: handleDeleteComponent,
        onAddControl: handleAddControl,
        onEditControl: handleEditControl,
        onDeleteControl: handleDeleteControl,
        onAddSection: handleAddSection,
        onAddFieldset: handleAddFieldset,
        onDeleteFieldset: handleDeleteFieldset,
        onUpdateFieldset: handleUpdateFieldset,
        onRequestAddControlToFieldset: handleRequestAddControlToFieldset,
        onActiveTabChange: setActiveTabId,
      }}
    >
      <div className={styles.componentsPage}>
        {error && <div className={styles.error}>Error: {error}</div>}

        <div className={styles.libraryPanel}>
          <ComponentLibrary />
        </div>

        <ComponentPreview />

        <AddComponentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSaveComponent} />
        <EditComponentDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdateComponent}
          component={componentToEdit}
        />
        <AddControlDialog
          open={isAddControlDialogOpen}
          onOpenChange={(open) => {
            setIsAddControlDialogOpen(open);
            if (!open) setIsAddingControlToFieldset(false);
          }}
          onAddControl={isAddingControlToFieldset ? handleAddControlToNewFieldset : handleAddControlToComponent}
        />
        <AddControlDialog
          open={isEditControlDialogOpen}
          onOpenChange={setIsEditControlDialogOpen}
          onAddControl={handleUpdateControlInComponent}
          initialControl={controlToEdit}
          mode="edit"
        />
        <DeleteConfirmDialog
          open={isDeleteConfirmDialogOpen}
          onOpenChange={setIsDeleteConfirmDialogOpen}
          onConfirm={handleConfirmDelete}
          componentName={componentToDelete?.name || ''}
        />
      </div>
    </ComponentBuilderProvider>
  );
};
