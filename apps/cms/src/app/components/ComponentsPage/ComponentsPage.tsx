'use client';

import { ComponentLibrary, ComponentPreview, ComponentType, type Component } from '@repo/ui';
import { useEffect, useState } from 'react';
import { deleteComponent, saveComponent, updateComponent } from '../actions';
import { AddComponentDialog } from '../AddComponentDialog';
import { AddControlDialog } from '../AddControlDialog';
import { ControlInstance } from '../controls';
import { EditComponentDialog } from '../EditComponentDialog';
import {
  loadComponentsFromLocalStorage,
  removeComponentFromLocalStorage,
  syncComponentWithLocalStorage,
} from '../localStorage';
import type { ComponentsPageProps } from './ComponentsPage.model';
import styles from './ComponentsPage.module.scss';

export const ComponentsPage = ({ initialComponents }: ComponentsPageProps) => {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddControlDialogOpen, setIsAddControlDialogOpen] = useState(false);
  const [isEditControlDialogOpen, setIsEditControlDialogOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<Component | null>(null);
  const [controlToEdit, setControlToEdit] = useState<ControlInstance | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  // Load and merge localStorage components on mount
  useEffect(() => {
    const localComponents = loadComponentsFromLocalStorage();
    if (localComponents.length > 0) {
      // Merge with initial components, avoiding duplicates
      const mergedComponents = [...initialComponents];
      localComponents.forEach((localComp) => {
        if (!mergedComponents.find((comp) => comp.id === localComp.id)) {
          mergedComponents.push(localComp);
        }
      });
      setComponents(mergedComponents);
    }
  }, [initialComponents]);

  const handleAddComponent = () => {
    setIsDialogOpen(true);
  };

  const handleSelectComponent = (component: Component) => {
    setSelectedComponent(component);
  };

  const handleAddControl = () => {
    if (!selectedComponent) return;
    setIsAddControlDialogOpen(true);
  };

  const handleEditControl = (control: ControlInstance) => {
    setControlToEdit(control);
    setIsEditControlDialogOpen(true);
  };

  const handleUpdateControlInComponent = (controlType: string, config: unknown) => {
    if (!selectedComponent || !controlToEdit) return;

    const updatedControls =
      selectedComponent.controls?.map((control) =>
        control.id === controlToEdit.id ? { ...control, config: config as Record<string, unknown> } : control,
      ) || [];

    const updatedComponent: Component = {
      ...selectedComponent,
      controls: updatedControls,
    };

    // Update local state
    setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
    setSelectedComponent(updatedComponent);

    // Save to localStorage
    syncComponentWithLocalStorage(updatedComponent);
  };

  const handleAddControlToComponent = (controlType: string, config: unknown) => {
    if (!selectedComponent) return;

    const newControl: ControlInstance = {
      id: `control-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      controlType,
      config: config as Record<string, unknown>,
      order: (selectedComponent.controls?.length || 0) + 1,
    };

    const updatedComponent: Component = {
      ...selectedComponent,
      controls: [...(selectedComponent.controls || []), newControl],
    };

    // Update local state
    setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
    setSelectedComponent(updatedComponent);

    // Save to localStorage
    syncComponentWithLocalStorage(updatedComponent);
  };

  const handleSaveComponent = async (name: string, description?: string) => {
    // Save to server
    const newComponent = await saveComponent(name, description);

    // Update local state
    setComponents((prev) => [...prev, newComponent]);

    // Save to localStorage
    syncComponentWithLocalStorage(newComponent);
  };

  const handleEditComponent = (component: Component) => {
    // Only allow editing user-defined components
    if (component.type !== ComponentType.USER_DEFINED) {
      console.warn('Cannot edit primitive components');
      return;
    }
    setComponentToEdit(component);
    setIsEditDialogOpen(true);
  };

  const handleUpdateComponent = async (id: string, name: string, description?: string) => {
    try {
      const updatedComponent = await updateComponent(id, name, description);
      if (updatedComponent) {
        // Update local state
        setComponents((prev) => prev.map((comp) => (comp.id === id ? updatedComponent : comp)));

        // Update localStorage
        syncComponentWithLocalStorage(updatedComponent);
      }
    } catch (error) {
      console.error('Failed to update component:', error);
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    // Find the component to check if it's user-defined
    const component = components.find((comp) => comp.id === componentId);
    if (!component || component.type !== ComponentType.USER_DEFINED) {
      console.warn('Cannot delete primitive components');
      return;
    }

    try {
      // Call server action to delete from server
      await deleteComponent(componentId);

      // Update local state
      setComponents((prev) => prev.filter((comp) => comp.id !== componentId));

      // Remove from localStorage
      removeComponentFromLocalStorage(componentId);
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  return (
    <div className={styles.componentsPage}>
      <div className={styles.libraryPanel}>
        <ComponentLibrary
          components={components}
          selectedComponent={selectedComponent}
          onAddComponent={handleAddComponent}
          onEditComponent={handleEditComponent}
          onDeleteComponent={handleDeleteComponent}
          onSelectComponent={handleSelectComponent}
        />
      </div>

      {/* Component Preview Section */}
      <ComponentPreview
        component={selectedComponent}
        onAddControl={handleAddControl}
        onEditControl={handleEditControl}
      />

      {/* Dialogs */}
      <AddComponentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSaveComponent} />
      <EditComponentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateComponent}
        component={componentToEdit}
      />
      <AddControlDialog
        open={isAddControlDialogOpen}
        onOpenChange={setIsAddControlDialogOpen}
        onAddControl={handleAddControlToComponent}
      />
      <AddControlDialog
        open={isEditControlDialogOpen}
        onOpenChange={setIsEditControlDialogOpen}
        onAddControl={handleUpdateControlInComponent}
        initialControl={controlToEdit}
        mode="edit"
      />
    </div>
  );
};
