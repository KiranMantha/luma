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
  const [activeTabId, setActiveTabId] = useState<string>(''); // Track active section tab

  // State for managing control addition to repeatable structures
  const [isAddingControlToFieldset, setIsAddingControlToFieldset] = useState(false);
  const [pendingFieldsetControls, setPendingFieldsetControls] = useState<ControlInstance[]>([]);

  // Handler for adding controls to repeatable structures (during structure creation)
  const handleAddControlToNewFieldset = async (controlType: ControlType, config: unknown) => {
    if (!isAddingControlToFieldset) return;

    // Extract label from config
    const configObj = config as Record<string, unknown>;
    const label = (configObj.label as string) || 'Untitled Control';

    // Create new control instance
    const newControl: ControlInstance = {
      id: `ctrl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      controlType,
      label,
      config: configObj,
      order: pendingFieldsetControls.length,
    };

    // Add to pending controls
    setPendingFieldsetControls([...pendingFieldsetControls, newControl]);

    // Call the global function to add to the fieldset dialog
    if ((window as unknown as Record<string, unknown>).addControlToFieldset) {
      (
        (window as unknown as Record<string, unknown>).addControlToFieldset as (type: ControlType, cfg: unknown) => void
      )(controlType, configObj);
    }

    // Close the dialog
    setIsAddControlDialogOpen(false);
  };

  // Handler to start adding controls to repeatable structure
  const handleRequestAddControlToFieldset = () => {
    setIsAddingControlToFieldset(true);
    setIsAddControlDialogOpen(true);
  };

  const handleAddComponent = () => {
    setIsDialogOpen(true);
  };

  const handleSelectComponent = (component: Component) => {
    setSelectedComponent(component);
  };

  const handleAddControl = (sectionId?: string) => {
    if (!selectedComponent) return;
    setTargetSectionId(sectionId || null);
    setIsAddingControlToFieldset(false); // Reset fieldset context
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

      // Extract label from config and pass it separately
      const configObj = config as Record<string, unknown>;
      const label = (configObj.label as string) || '';

      // Remove label from config since it should be stored in the label field
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { label: labelFromConfig, ...configWithoutLabel } = configObj;

      // Save control to database with section assignment
      await addControlToComponent(
        selectedComponent.id,
        controlType,
        label,
        configWithoutLabel,
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

    // Automatically select the newly created component to show its General tab
    setSelectedComponent(newComponent);

    // Set the General tab as active (it should be the first section)
    if (newComponent.sections && newComponent.sections.length > 0 && newComponent.sections[0]) {
      setActiveTabId(newComponent.sections[0].id);
    }

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

    // Show confirmation dialog instead of deleting immediately
    setComponentToDelete(component);
    setIsDeleteConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;

    try {
      // Call server action to delete from server
      await deleteComponent(componentToDelete.id);

      // Update local state
      setComponents((prev) => prev.filter((comp) => comp.id !== componentToDelete.id));

      // Clear selected component if it was the one being deleted
      if (selectedComponent?.id === componentToDelete.id) {
        setSelectedComponent(null);
        setActiveTabId(''); // Also clear the active tab
      }

      // Close dialog and clear component to delete
      setIsDeleteConfirmDialogOpen(false);
      setComponentToDelete(null);

      // Note: API actions handle revalidation via revalidatePath
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmDialogOpen(false);
    setComponentToDelete(null);
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

  const handleAddControlToExistingFieldset = (fieldsetId: string) => {
    // Open the add control dialog but target the repeatable structure instead of section
    // For now, we'll use the same dialog but store the structureId context
    console.log('Adding control to fieldset:', fieldsetId);
    // TODO: Implement server-side API for adding controls to repeatable structures
    // This would be similar to handleAddControl but target a structure instead of section

    // Store the structureId context and open dialog
    // We'll need to modify the AddControlDialog to handle structure context
    setIsAddControlDialogOpen(true);
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
      console.log('Adding repeatable structure to section:', { sectionId, name, description, controls });

      // Save the repeatable structure to the backend
      await addFieldsetToSection(selectedComponent.id, sectionId, name, description, controls);

      // Refresh the component to show the new structure
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setSelectedComponent(updatedComponent);
        setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
      }
    } catch (err) {
      console.error('Error adding repeatable structure:', err);
      setError('Failed to add repeatable structure');
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
      console.log('Updating fieldset:', { fieldsetId, name, description, controls });

      // Find the fieldset to get the section ID
      let sectionId = '';
      const sections = selectedComponent.sections || [];
      for (const section of sections) {
        if (section.fieldsets?.some((fieldset) => fieldset.id === fieldsetId)) {
          sectionId = section.id;
          break;
        }
      }

      if (!sectionId) {
        throw new Error('Could not find section for fieldset');
      }

      // Update the fieldset in the backend
      await updateFieldsetInSection(selectedComponent.id, sectionId, fieldsetId, name, description, controls);

      // Refresh the component to show the updated structure
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setSelectedComponent(updatedComponent);
        setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
      }
    } catch (err) {
      console.error('Error updating repeatable structure:', err);
      setError('Failed to update repeatable structure');
    }
  };

  const handleDeleteFieldset = async (fieldsetId: string) => {
    if (!selectedComponent) return;

    try {
      setError(null);
      console.log('Deleting fieldset:', fieldsetId);

      // Find the fieldset to get the section ID
      let sectionId = '';
      const sections = selectedComponent.sections || [];
      for (const section of sections) {
        if (section.fieldsets?.some((fieldset) => fieldset.id === fieldsetId)) {
          sectionId = section.id;
          break;
        }
      }

      if (!sectionId) {
        throw new Error('Could not find section for structure');
      }

      // Delete the fieldset from the backend
      await deleteFieldsetFromSection(selectedComponent.id, sectionId, fieldsetId);

      // Refresh the component to show the updated structure list
      const allComponents = await getComponents();
      const updatedComponent = allComponents.find((comp: Component) => comp.id === selectedComponent.id);

      if (updatedComponent) {
        setSelectedComponent(updatedComponent);
        setComponents((prev) => prev.map((comp) => (comp.id === selectedComponent.id ? updatedComponent : comp)));
      }
    } catch (err) {
      console.error('Error deleting repeatable structure:', err);
      setError('Failed to delete repeatable structure');
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
        onAddControlToFieldset={handleAddControlToExistingFieldset}
        onEditControl={handleEditControl}
        onDeleteControl={handleDeleteControl}
        onAddSection={handleAddSection}
        onAddFieldset={handleAddFieldset}
        onDeleteFieldset={handleDeleteFieldset}
        onUpdateFieldset={handleUpdateFieldset}
        onRequestAddControlToFieldset={handleRequestAddControlToFieldset}
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
        onOpenChange={(open) => {
          setIsAddControlDialogOpen(open);
          if (!open) {
            setIsAddingControlToFieldset(false); // Reset context when closing
          }
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
  );
};
