/**
 * Server actions for component management
 */

'use server';

import { ComponentType, ControlType, type Component, type ControlInstance } from '@repo/ui';
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

export async function getAvailableComponentsForPages(): Promise<Component[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/available-for-pages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch available components for pages: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching available components for pages:', error);
    return [];
  }
}

export async function getAllComponentsForTemplates(): Promise<Component[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/all-for-templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch components for templates: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching components for templates:', error);
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
  controlType: ControlType,
  label: string,
  config: Record<string, unknown>,
  orderIndex: number,
  sectionId?: string,
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
        sectionId,
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

// Section management functions
export async function addSectionToComponent(
  componentId: string,
  name: string,
  isRepeatable?: boolean,
  minItems?: number,
  maxItems?: number,
): Promise<{
  id: string;
  name: string;
  order: number;
  controls: ControlInstance[];
  isRepeatable?: boolean;
  minItems?: number;
  maxItems?: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        isRepeatable: isRepeatable || false,
        minItems: isRepeatable ? minItems || 0 : undefined,
        maxItems: isRepeatable ? maxItems : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add section: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error adding section:', error);
    throw new Error('Failed to add section');
  }
}

export async function updateSection(
  componentId: string,
  sectionId: string,
  name: string,
): Promise<{ id: string; name: string; order: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update section: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error updating section:', error);
    throw new Error('Failed to update section');
  }
}

export async function deleteSection(componentId: string, sectionId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete section: ${response.statusText}`);
    }

    // Revalidate the page to show fresh data
    revalidatePath('/components');
  } catch (error) {
    console.error('Error deleting section:', error);
    throw new Error('Failed to delete section');
  }
}

// Repeatable structure management functions
export async function addRepeatableStructureToSection(
  componentId: string,
  sectionId: string,
  name: string,
  description?: string,
  controls?: ControlInstance[],
): Promise<{
  id: string;
  name: string;
  description?: string;
  order: number;
  fields: ControlInstance[];
}> {
  console.log('SERVER ACTION: addRepeatableStructureToSection called with:', {
    componentId,
    sectionId,
    name,
    description,
    controlsLength: controls?.length || 0,
  });

  try {
    console.log(
      'SERVER ACTION: Making API call to:',
      `${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures`,
    );

    const transformedControls = (controls || []).map((control) => {
      console.log('SERVER ACTION: Transforming control:', control);

      // Handle both ControlInstance format and RepeatableStructureField format
      const controlAny = control as any;

      if ('controlType' in control) {
        // ControlInstance format (from AddControlDialog)
        return {
          name: control.id,
          type: control.controlType,
          label: control.label || 'Untitled Control',
          placeholder: (control.config?.placeholder as string) || '',
          isRequired: Boolean(control.config?.required) || false,
          config: control.config || {},
        };
      } else {
        // RepeatableStructureField format (from existing structure)
        return {
          name: controlAny.name || controlAny.id || 'field',
          type: controlAny.type || 'TEXT',
          label: controlAny.label || 'Untitled Control',
          placeholder: controlAny.placeholder || '',
          isRequired: Boolean(controlAny.isRequired) || false,
          config: controlAny.config || {},
        };
      }
    });

    const payload = {
      name,
      description: description?.trim() || undefined,
      controls: transformedControls,
    };

    console.log('SERVER ACTION: Sending payload:', payload);

    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to add repeatable structure: ${response.statusText}`);
    }

    const result = await response.json();

    // Note: No migration needed for new structures as they don't affect existing content

    // Revalidate the page to show fresh data
    revalidatePath('/components');
    revalidatePath('/templates'); // Also revalidate templates

    return result.data;
  } catch (error) {
    console.error('Error adding repeatable structure:', error);
    throw new Error('Failed to add repeatable structure');
  }
}

export async function updateRepeatableStructureInSection(
  componentId: string,
  sectionId: string,
  structureId: string,
  name: string,
  description?: string,
  controls?: ControlInstance[],
): Promise<{
  id: string;
  name: string;
  description?: string;
  order: number;
  fields: ControlInstance[];
}> {
  console.log('SERVER ACTION: updateRepeatableStructureInSection called with:', {
    componentId,
    sectionId,
    structureId,
    name,
    description,
    controlsLength: controls?.length || 0,
  });

  try {
    console.log('SERVER ACTION: Making API call to update structure');

    const transformedControls = (controls || []).map((control) => {
      console.log('SERVER ACTION: Transforming control for update:', control);

      // Handle both ControlInstance format and RepeatableStructureField format
      const controlAny = control as any;

      if ('controlType' in control) {
        // ControlInstance format (from AddControlDialog)
        return {
          name: control.id,
          type: control.controlType,
          label: control.label || 'Untitled Control',
          placeholder: (control.config?.placeholder as string) || '',
          isRequired: Boolean(control.config?.required) || false,
          config: control.config || {},
        };
      } else {
        // RepeatableStructureField format (from existing structure)
        return {
          name: controlAny.name || controlAny.id || 'field',
          type: controlAny.type || 'TEXT',
          label: controlAny.label || 'Untitled Control',
          placeholder: controlAny.placeholder || '',
          isRequired: Boolean(controlAny.isRequired) || false,
          config: controlAny.config || {},
        };
      }
    });

    const payload = {
      name,
      description: description?.trim() || null, // Send null for empty description to clear it
      controls: transformedControls,
    };

    console.log('SERVER ACTION: Sending update payload:', payload);

    const response = await fetch(
      `${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures/${structureId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update repeatable structure: ${response.statusText}`);
    }

    const result = await response.json();

    // Migrate existing component instances after structure update
    await migrateComponentInstancesAfterStructureChange(componentId, structureId, result.data);

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error updating repeatable structure:', error);
    throw new Error('Failed to update repeatable structure');
  }
}

// Migration function to preserve content when component structures change
async function migrateComponentInstancesAfterStructureChange(
  componentId: string,
  structureId: string,
  updatedStructure: any,
): Promise<void> {
  try {
    console.log('MIGRATION: Starting migration for component instances after structure change');

    // Get all templates that might contain instances of this component
    const templatesResponse = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!templatesResponse.ok) {
      console.warn('MIGRATION: Could not fetch templates for migration');
      return;
    }

    const templatesResult = await templatesResponse.json();
    const templates = templatesResult.data || [];

    for (const template of templates) {
      let templateNeedsUpdate = false;
      const updatedZones = template.zones?.map((zone: any) => {
        const updatedInstances = zone.componentInstances?.map((instance: any) => {
          if (instance.componentId === componentId) {
            console.log('MIGRATION: Found component instance to migrate:', instance.id);

            const migratedConfig = migrateInstanceConfig(instance.config || {}, updatedStructure);

            if (JSON.stringify(migratedConfig) !== JSON.stringify(instance.config)) {
              console.log('MIGRATION: Config changed, updating instance');
              templateNeedsUpdate = true;
              return { ...instance, config: migratedConfig };
            }
          }
          return instance;
        });

        return { ...zone, componentInstances: updatedInstances };
      });

      // Update template if any instances were migrated
      if (templateNeedsUpdate) {
        console.log('MIGRATION: Updating template:', template.id);
        const updateResponse = await fetch(`${API_BASE_URL}/api/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...template, zones: updatedZones }),
        });

        if (updateResponse.ok) {
          console.log('MIGRATION: Successfully updated template:', template.id);
        } else {
          console.warn('MIGRATION: Failed to update template:', template.id);
        }
      }
    }

    console.log('MIGRATION: Migration completed');
  } catch (error) {
    console.error('MIGRATION: Error during migration:', error);
  }
}

// Helper function to migrate instance configuration
function migrateInstanceConfig(config: Record<string, unknown>, updatedStructure: any): Record<string, unknown> {
  const migratedConfig = { ...config };

  // Check if this structure exists in the config
  const structureContent = config[updatedStructure.name] as unknown[];

  if (Array.isArray(structureContent) && structureContent.length > 0 && updatedStructure.fields) {
    console.log('MIGRATION: Migrating structure content for:', updatedStructure.name);

    const migratedItems = structureContent.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const itemObj = item as Record<string, unknown>;
        const migratedItem: Record<string, unknown> = {};

        const itemKeys = Object.keys(itemObj);
        const currentFieldIds = updatedStructure.fields?.map((field: any) => field.id) || [];

        // Check if any of the current field IDs exist in the item
        const hasCurrentFields = itemKeys.some((key) => currentFieldIds.includes(key));

        if (!hasCurrentFields && itemKeys.length > 0 && updatedStructure.fields.length > 0) {
          // Migrate old field references to new ones by mapping values in order
          console.log('MIGRATION: Migrating old field references to new structure');

          const oldValues = Object.values(itemObj);
          const newFields = updatedStructure.fields;

          // Map old values to new field IDs in order (up to the number of available fields)
          for (let i = 0; i < Math.min(oldValues.length, newFields.length); i++) {
            const value = oldValues[i];
            const newField = newFields[i];

            if (newField?.id && value !== undefined) {
              console.log(`MIGRATION: Mapping value ${i} to field ${newField.id}:`, value);
              migratedItem[newField.id] = value;
            }
          }

          return migratedItem;
        } else {
          // Keep existing mapping if field IDs are current
          return item;
        }
      }
      return item;
    });

    migratedConfig[updatedStructure.name] = migratedItems;
  }

  return migratedConfig;
}

// Cleanup function to remove references to deleted structures from component instances
async function cleanupInstanceDataAfterStructureDeletion(componentId: string, structureId: string): Promise<void> {
  try {
    console.log('CLEANUP: Starting cleanup for deleted structure:', structureId);

    // Get all templates that might contain instances of this component
    const templatesResponse = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!templatesResponse.ok) {
      console.warn('CLEANUP: Could not fetch templates for cleanup');
      return;
    }

    const templatesResult = await templatesResponse.json();
    const templates = templatesResult.data || [];

    for (const template of templates) {
      let templateNeedsUpdate = false;
      const updatedZones = template.zones?.map((zone: any) => {
        const updatedInstances = zone.componentInstances?.map((instance: any) => {
          if (instance.componentId === componentId) {
            console.log('CLEANUP: Checking component instance:', instance.id);

            const config = instance.config || {};
            const cleanedConfig = { ...config };

            // Remove any structure content that references the deleted structure
            // We don't have the structure name here, so we'll need to clean up based on structure ID
            // This is a limitation - we might need to pass the structure name as well
            Object.keys(config).forEach((key) => {
              const value = config[key];
              if (Array.isArray(value) && value.length > 0) {
                // Check if this might be structure content that needs cleaning
                console.log('CLEANUP: Found array content for key:', key);
                // For now, we'll keep the content as the user might want to preserve it
                // In the future, we could add logic to identify orphaned structure content
              }
            });

            if (JSON.stringify(cleanedConfig) !== JSON.stringify(config)) {
              console.log('CLEANUP: Config changed, updating instance');
              templateNeedsUpdate = true;
              return { ...instance, config: cleanedConfig };
            }
          }
          return instance;
        });

        return { ...zone, componentInstances: updatedInstances };
      });

      // Update template if any instances were cleaned
      if (templateNeedsUpdate) {
        console.log('CLEANUP: Updating template:', template.id);
        const updateResponse = await fetch(`${API_BASE_URL}/api/templates/${template.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...template, zones: updatedZones }),
        });

        if (updateResponse.ok) {
          console.log('CLEANUP: Successfully updated template:', template.id);
        } else {
          console.warn('CLEANUP: Failed to update template:', template.id);
        }
      }
    }

    console.log('CLEANUP: Cleanup completed');
  } catch (error) {
    console.error('CLEANUP: Error during cleanup:', error);
  }
}

export async function deleteRepeatableStructureFromSection(
  componentId: string,
  sectionId: string,
  structureId: string,
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures/${structureId}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete repeatable structure: ${response.statusText}`);
    }

    // When deleting structures, we need to clean up any instance data that references them
    await cleanupInstanceDataAfterStructureDeletion(componentId, structureId);

    // Revalidate the page to show fresh data
    revalidatePath('/components');
    revalidatePath('/templates'); // Also revalidate templates since instances may have changed
  } catch (error) {
    console.error('Error deleting repeatable structure:', error);
    throw error;
  }
}
