'use client';

import { Component, ComponentLibrary, ComponentPreview, ComponentType, ControlInstance } from '@repo/ui';
import { use, useState } from 'react';
import {
  addControlToComponent,
  deleteComponent,
  deleteControl,
  saveComponent,
  updateComponent,
  updateControl,
} from '../actions';
import { AddComponentDialog } from '../AddComponentDialog';
import { AddControlDialog } from '../AddControlDialog';
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
  const [componentToEdit, setComponentToEdit] = useState<Component | null>(null);
  const [controlToEdit, setControlToEdit] = useState<ControlInstance | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

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

  const handleUpdateControlInComponent = async (controlType: string, config: unknown) => {
    if (!selectedComponent || !controlToEdit) return;

    try {
      setError(null); // Clear any previous errors

      // Update control in database
      const updatedControl = await updateControl(selectedComponent.id, controlToEdit.id, {
        controlType,
        config: config as Record<string, unknown>,
      });

      // Update local state with the updated control
      const updatedControls =
        selectedComponent.controls?.map((control) => (control.id === controlToEdit.id ? updatedControl : control)) ||
        [];

      const updatedComponent: Component = {
        ...selectedComponent,
        controls: updatedControls,
      };

      setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
      setSelectedComponent(updatedComponent);
    } catch (error) {
      console.error('Failed to update control:', error);
      setError('Failed to update control');
    }
  };

  const handleDeleteControl = async (controlId: string) => {
    if (!selectedComponent) return;

    try {
      // Delete control from database
      await deleteControl(selectedComponent.id, controlId);

      // Update local state by removing the control
      const updatedControls = selectedComponent.controls?.filter((control) => control.id !== controlId) || [];

      const updatedComponent: Component = {
        ...selectedComponent,
        controls: updatedControls,
      };

      setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
      setSelectedComponent(updatedComponent);
    } catch (error) {
      console.error('Failed to delete control:', error);
      setError('Failed to delete control');
    }
  };

  const handleAddControlToComponent = async (controlType: string, config: unknown) => {
    if (!selectedComponent) return;

    try {
      setError(null); // Clear any previous errors

      // Save control to database
      const newControl = await addControlToComponent(
        selectedComponent.id,
        controlType,
        '', // label - can be empty for now
        config as Record<string, unknown>,
        (selectedComponent.controls?.length || 0) + 1, // orderIndex
      );

      // Update local state with the control returned from the API
      const updatedComponent: Component = {
        ...selectedComponent,
        controls: [...(selectedComponent.controls || []), newControl],
      };

      setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
      setSelectedComponent(updatedComponent);
    } catch (error) {
      console.error('Failed to add control:', error);
      setError('Failed to add control to component');
    }
  };

  const handleSaveComponent = async (name: string, description?: string) => {
    // Save to server
    const newComponent = await saveComponent(name, description);

    // Update local state
    setComponents((prev) => [...prev, newComponent]);

    // Note: API actions handle revalidation via revalidatePath
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
      const updatedComponent = await updateComponent(id, { name, description });
      if (updatedComponent) {
        // Update local state
        setComponents((prev) => prev.map((comp) => (comp.id === id ? updatedComponent : comp)));

        // Note: API actions handle revalidation via revalidatePath
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

      // Note: API actions handle revalidation via revalidatePath
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  return (
    <div className={styles.componentsPage}>
      {error && <div className={styles.error}>Error: {error}</div>}
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
