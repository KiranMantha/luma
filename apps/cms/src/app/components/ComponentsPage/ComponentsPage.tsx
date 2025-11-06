'use client';

import {
  addControlToComponent,
  addSectionToComponent,
  deleteComponent,
  deleteControl,
  getComponents,
  saveComponent,
  updateComponent,
  updateControl,
} from '@/actions';
import {
  Component,
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
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>(''); // Track active section tab

  const handleAddComponent = () => {
    setIsDialogOpen(true);
  };

  const handleSelectComponent = (component: Component) => {
    setSelectedComponent(component);
  };

  const handleAddControl = (sectionId?: string) => {
    if (!selectedComponent) return;
    setTargetSectionId(sectionId || null);
    setIsAddControlDialogOpen(true);
  };

  const handleEditControl = (control: ControlInstance) => {
    setControlToEdit(control);
    setIsEditControlDialogOpen(true);
  };

  const handleUpdateControlInComponent = async (controlType: ControlType, config: unknown) => {
    if (!selectedComponent || !controlToEdit) return;

    try {
      setError(null); // Clear any previous errors

      // Update control in database
      await updateControl(selectedComponent.id, controlToEdit.id, {
        controlType,
        config: config as Record<string, unknown>,
      });

      // Refetch the complete component to get the updated state
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setComponents(allComponents);
        setSelectedComponent(updatedComponent);
      }
    } catch (error) {
      console.error('Failed to update control:', error);
      setError('Failed to update control');
    }
  };

  const handleDeleteControl = async (controlId: string) => {
    if (!selectedComponent) return;

    try {
      setError(null); // Clear any previous errors

      // Delete control from database
      await deleteControl(selectedComponent.id, controlId);

      // Refetch the complete component to get the updated state
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setComponents(allComponents);
        setSelectedComponent(updatedComponent);
      }
    } catch (error) {
      console.error('Failed to delete control:', error);
      setError('Failed to delete control');
    }
  };

  const handleAddControlToComponent = async (controlType: ControlType, config: unknown) => {
    if (!selectedComponent) return;

    try {
      setError(null); // Clear any previous errors

      // Determine the target section for sectioned components
      let targetSection: string | undefined;
      if (selectedComponent.sections && selectedComponent.sections.length > 0) {
        targetSection = targetSectionId || selectedComponent.sections[0]?.id;
      }

      // Save control to database with section assignment
      await addControlToComponent(
        selectedComponent.id,
        controlType,
        '', // label - can be empty for now
        config as Record<string, unknown>,
        getTotalControlsCount(selectedComponent.sections || []) + 1, // orderIndex
        targetSection, // Pass the target section ID
      );

      // Refetch the complete component to get the updated state
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setComponents(allComponents);
        setSelectedComponent(updatedComponent);
      }

      // Clear target section after adding control
      setTargetSectionId(null);
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

      // Clear selected component if it was the one being deleted
      if (selectedComponent?.id === componentId) {
        setSelectedComponent(null);
        setActiveTabId(''); // Also clear the active tab
      }

      // Note: API actions handle revalidation via revalidatePath
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const handleAddSection = async (sectionName: string) => {
    if (!selectedComponent) return;

    try {
      setError(null);

      // Save section to database and get the new section data
      const newSection = await addSectionToComponent(selectedComponent.id, sectionName);

      // Refetch the complete component with all sections from the API
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setComponents(allComponents);
        setSelectedComponent(updatedComponent);
        // Set the newly created section as active
        setActiveTabId(newSection.id);
      }
    } catch (error) {
      console.error('Failed to add section:', error);
      setError('Failed to add section to component');
    }
  };

  const handleActiveTabChange = (tabId: string) => {
    setActiveTabId(tabId);
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
        activeTabId={activeTabId}
        onAddControl={handleAddControl}
        onEditControl={handleEditControl}
        onDeleteControl={handleDeleteControl}
        onAddSection={handleAddSection}
        onActiveTabChange={handleActiveTabChange}
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
