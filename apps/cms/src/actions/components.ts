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
    controlsLength: controls?.length || 0
  });
  
  try {
    console.log('SERVER ACTION: Making API call to:', `${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures`);
    
    const transformedControls = (controls || []).map(control => {
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

    // Revalidate the page to show fresh data
    revalidatePath('/components');

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
    controlsLength: controls?.length || 0
  });
  
  try {
    console.log('SERVER ACTION: Making API call to update structure');
    
    const transformedControls = (controls || []).map(control => {
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
    
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures/${structureId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update repeatable structure: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidate the page to show fresh data
    revalidatePath('/components');

    return result.data;
  } catch (error) {
    console.error('Error updating repeatable structure:', error);
    throw new Error('Failed to update repeatable structure');
  }
}

export async function deleteRepeatableStructureFromSection(
  componentId: string,
  sectionId: string,
  structureId: string,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/components/${componentId}/sections/${sectionId}/structures/${structureId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete repeatable structure: ${response.statusText}`);
    }

    // Revalidate the page to show fresh data
    revalidatePath('/components');
  } catch (error) {
    console.error('Error deleting repeatable structure:', error);
    throw error;
  }
}
