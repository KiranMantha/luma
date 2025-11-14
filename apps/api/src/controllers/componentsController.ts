import { desc, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { componentControls, components, componentSections, repeatableStructures, repeatableStructureFields, templates } from '../db/schema';
import type {
  CreateComponentControlRequest,
  CreateComponentRequest,
  CreateRepeatableStructureRequest,
  UpdateComponentControlRequest,
  UpdateComponentRequest,
} from '../types/component';
import { successResponse } from '../types/response';

// Utility function to get all component IDs used in templates
const getComponentsUsedInTemplates = async (): Promise<Set<string>> => {
  const usedComponents = new Set<string>();

  try {
    // Get all templates
    const allTemplates = await db.select().from(templates);

    for (const template of allTemplates) {
      if (template.metadata) {
        const metadata = JSON.parse(template.metadata);
        const zones = metadata.zones || [];

        // Extract component IDs from all zones
        for (const zone of zones) {
          if (zone.componentInstances) {
            for (const instance of zone.componentInstances) {
              if (instance.componentId) {
                usedComponents.add(instance.componentId);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting components used in templates:', error);
  }

  return usedComponents;
};

export const getAllComponents = async (ctx: Context) => {
  const allComponents = await db.select().from(components).orderBy(desc(components.createdAt));

  // Return ALL components for the component builder - don't filter any out
  // The filtering should only happen in PageBuilder, not in Component Builder itself
  const componentsWithControlsAndSections = await Promise.all(
    allComponents.map(async (component) => {
      // Get all controls for this component
      const controls = await db
        .select()
        .from(componentControls)
        .where(eq(componentControls.componentId, component.id))
        .orderBy(componentControls.orderIndex);

      // Get all sections for this component
      const sections = await db
        .select()
        .from(componentSections)
        .where(eq(componentSections.componentId, component.id))
        .orderBy(componentSections.orderIndex);

      const parsedControls = controls.map((control) => ({
        ...control,
        config: control.config ? JSON.parse(control.config) : {},
      }));

      // If component has sections, organize controls by section
      if (sections.length > 0) {
        const sectionsWithControls = await Promise.all(
          sections.map(async (section) => {
            // Get repeatable structures for this section
            const structures = await db
              .select()
              .from(repeatableStructures)
              .where(eq(repeatableStructures.sectionId, section.id))
              .orderBy(repeatableStructures.orderIndex);

            const structuresWithFields = await Promise.all(
              structures.map(async (structure) => {
                const fields = await db
                  .select()
                  .from(repeatableStructureFields)
                  .where(eq(repeatableStructureFields.structureId, structure.id))
                  .orderBy(repeatableStructureFields.orderIndex);

                return {
                  ...structure,
                  fields: fields.map((field) => ({
                    ...field,
                    config: field.config ? JSON.parse(field.config) : {},
                  })),
                };
              })
            );

            return {
              id: section.id,
              name: section.name,
              order: section.orderIndex,
              controls: parsedControls.filter((control) => control.sectionId === section.id),
              repeatableStructures: structuresWithFields,
            };
          })
        );

        return {
          ...component,
          controls: parsedControls.filter((control) => !control.sectionId), // Legacy controls without section
          sections: sectionsWithControls,
        };
      } else {
        // Legacy component without sections
        return {
          ...component,
          controls: parsedControls,
        };
      }
    }),
  );

  return successResponse(ctx, componentsWithControlsAndSections);
};

// Get available components for pages (excluding those used in templates)
export const getAvailableComponentsForPages = async (ctx: Context) => {
  const allComponents = await db.select().from(components).orderBy(desc(components.createdAt));

  // Get components used in templates to exclude them from the available list for pages
  const usedInTemplates = await getComponentsUsedInTemplates();

  // Filter out components that are already used in templates
  const availableComponents = allComponents.filter((component) => !usedInTemplates.has(component.id));

  const componentsWithControlsAndSections = await Promise.all(
    availableComponents.map(async (component) => {
      // Get all controls for this component
      const controls = await db
        .select()
        .from(componentControls)
        .where(eq(componentControls.componentId, component.id))
        .orderBy(componentControls.orderIndex);

      // Get all sections for this component
      const sections = await db
        .select()
        .from(componentSections)
        .where(eq(componentSections.componentId, component.id))
        .orderBy(componentSections.orderIndex);

      const parsedControls = controls.map((control) => ({
        ...control,
        config: control.config ? JSON.parse(control.config) : {},
      }));

      // If component has sections, organize controls by section
      if (sections.length > 0) {
        const sectionsWithControls = sections.map((section) => ({
          id: section.id,
          name: section.name,
          order: section.orderIndex,
          controls: parsedControls.filter((control) => control.sectionId === section.id),
        }));

        return {
          ...component,
          controls: parsedControls.filter((control) => !control.sectionId), // Legacy controls without section
          sections: sectionsWithControls,
        };
      } else {
        // Legacy component without sections
        return {
          ...component,
          controls: parsedControls,
        };
      }
    }),
  );

  return successResponse(ctx, componentsWithControlsAndSections);
};

// Get all components including those used in templates (for template builder)
export const getAllComponentsForTemplates = async (ctx: Context) => {
  const allComponents = await db.select().from(components).orderBy(desc(components.createdAt));

  const componentsWithControlsAndSections = await Promise.all(
    allComponents.map(async (component) => {
      // Get all controls for this component
      const controls = await db
        .select()
        .from(componentControls)
        .where(eq(componentControls.componentId, component.id))
        .orderBy(componentControls.orderIndex);

      // Get all sections for this component
      const sections = await db
        .select()
        .from(componentSections)
        .where(eq(componentSections.componentId, component.id))
        .orderBy(componentSections.orderIndex);

      const parsedControls = controls.map((control) => ({
        ...control,
        config: control.config ? JSON.parse(control.config) : {},
      }));

      // If component has sections, organize controls by section
      if (sections.length > 0) {
        const sectionsWithControls = sections.map((section) => ({
          id: section.id,
          name: section.name,
          order: section.orderIndex,
          controls: parsedControls.filter((control) => control.sectionId === section.id),
        }));

        return {
          ...component,
          controls: parsedControls.filter((control) => !control.sectionId), // Legacy controls without section
          sections: sectionsWithControls,
        };
      } else {
        // Legacy component without sections
        return {
          ...component,
          controls: parsedControls,
        };
      }
    }),
  );

  return successResponse(ctx, componentsWithControlsAndSections);
};

export const getComponentById = async (ctx: Context) => {
  const id = ctx.req.param('id');
  const component = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!component) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  // Get all controls for this component
  const controls = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.componentId, id))
    .orderBy(componentControls.orderIndex);

  // Get all sections for this component
  const sections = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.componentId, id))
    .orderBy(componentSections.orderIndex);

  const parsedControls = controls.map((control) => ({
    ...control,
    config: control.config ? JSON.parse(control.config) : {},
  }));

  // If component has sections, organize controls by section
  if (sections.length > 0) {
    const sectionsWithControls = await Promise.all(
      sections.map(async (section) => {
        // Get repeatable structures for this section
        const structures = await db
          .select()
          .from(repeatableStructures)
          .where(eq(repeatableStructures.sectionId, section.id))
          .orderBy(repeatableStructures.orderIndex);

        const structuresWithFields = await Promise.all(
          structures.map(async (structure) => {
            const fields = await db
              .select()
              .from(repeatableStructureFields)
              .where(eq(repeatableStructureFields.structureId, structure.id))
              .orderBy(repeatableStructureFields.orderIndex);

            return {
              ...structure,
              fields: fields.map((field) => ({
                ...field,
                config: field.config ? JSON.parse(field.config) : {},
              })),
            };
          })
        );

        return {
          id: section.id,
          name: section.name,
          order: section.orderIndex,
          controls: parsedControls.filter((control) => control.sectionId === section.id),
          repeatableStructures: structuresWithFields,
        };
      })
    );

    const componentWithSections = {
      ...component,
      controls: parsedControls.filter((control) => !control.sectionId), // Legacy controls without section
      sections: sectionsWithControls,
    };

    return successResponse(ctx, componentWithSections);
  } else {
    // Legacy component without sections
    const componentWithControls = {
      ...component,
      controls: parsedControls,
    };

    return successResponse(ctx, componentWithControls);
  }
};

export const createComponent = async (ctx: Context) => {
  const data: CreateComponentRequest = await ctx.req.json();
  const id = nanoid();

  // Create the component
  await db.insert(components).values({
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Automatically create a "General" section for the new component
  const generalSectionId = nanoid();
  await db.insert(componentSections).values({
    id: generalSectionId,
    componentId: id,
    name: 'General',
    orderIndex: 0,
    createdAt: new Date().toISOString(),
  });

  // Fetch the complete component with its section
  const newComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  const sections = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.componentId, id))
    .orderBy(componentSections.orderIndex);

  const sectionsWithControls = sections.map((section) => ({
    id: section.id,
    name: section.name,
    order: section.orderIndex,
    controls: [], // New component starts with empty controls
  }));

  const componentWithSections = {
    ...newComponent,
    controls: [], // Legacy support
    sections: sectionsWithControls,
  };

  return successResponse(ctx, componentWithSections, 201);
};

export const updateComponent = async (ctx: Context) => {
  const id = ctx.req.param('id');
  const data: UpdateComponentRequest = await ctx.req.json();
  const existingComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingComponent) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  await db
    .update(components)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(components.id, id));

  const updatedComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  const controls = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.componentId, id))
    .orderBy(componentControls.orderIndex);

  const componentWithControls = {
    ...updatedComponent,
    controls: controls.map((control) => ({
      ...control,
      config: control.config ? JSON.parse(control.config) : {},
    })),
  };

  return successResponse(ctx, componentWithControls);
};

export const deleteComponent = async (ctx: Context) => {
  const id = ctx.req.param('id');
  const existingComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingComponent) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  await db.delete(components).where(eq(components.id, id));
  return successResponse(ctx, { message: 'Component deleted successfully' }, 200);
};

export const addControlToComponent = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const data: CreateComponentControlRequest = await ctx.req.json();
  const component = await db
    .select()
    .from(components)
    .where(eq(components.id, componentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!component) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  const controlId = nanoid();

  await db.insert(componentControls).values({
    id: controlId,
    componentId,
    ...data,
    config: JSON.stringify(data.config),
  });

  const newControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  const controlData = {
    ...newControl,
    config: newControl?.config ? JSON.parse(newControl.config) : {},
  };

  return successResponse(ctx, controlData, 201);
};

export const updateControl = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const controlId = ctx.req.param('controlId');
  const data: UpdateComponentControlRequest = await ctx.req.json();
  const existingControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingControl || existingControl.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Control not found' });
  }

  const updateData: any = { ...data };
  if (data.config) {
    updateData.config = JSON.stringify(data.config);
  }

  await db.update(componentControls).set(updateData).where(eq(componentControls.id, controlId));

  const updatedControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  const controlData = {
    ...updatedControl,
    config: updatedControl?.config ? JSON.parse(updatedControl.config) : {},
  };

  return successResponse(ctx, controlData, 200);
};

export const deleteControl = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const controlId = ctx.req.param('controlId');
  const existingControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingControl || existingControl.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Control not found' });
  }

  await db.delete(componentControls).where(eq(componentControls.id, controlId));
  return successResponse(ctx, { message: 'Control deleted successfully' }, 200);
};

// Section management functions
export const addSectionToComponent = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const { name } = await ctx.req.json();

  const component = await db
    .select()
    .from(components)
    .where(eq(components.id, componentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!component) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  // Get current sections count for order (all components now have at least "General" section)
  const existingSections = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.componentId, componentId));

  // Create the user's requested section
  const newSectionId = nanoid();

  await db.insert(componentSections).values({
    id: newSectionId,
    componentId,
    name,
    orderIndex: existingSections.length, // Simply append to the end
    createdAt: new Date().toISOString(),
  });

  const newSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, newSectionId))
    .limit(1)
    .then((rows) => rows[0]);

  const sectionData = {
    id: newSection!.id,
    name: newSection!.name,
    order: newSection!.orderIndex,
    controls: [],
  };

  return successResponse(ctx, sectionData, 201);
};

export const updateComponentSection = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const sectionId = ctx.req.param('sectionId');
  const { name } = await ctx.req.json();

  const existingSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, sectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingSection || existingSection.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Section not found' });
  }

  await db.update(componentSections).set({ name }).where(eq(componentSections.id, sectionId));

  const updatedSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, sectionId))
    .limit(1)
    .then((rows) => rows[0]);

  return successResponse(ctx, {
    id: updatedSection!.id,
    name: updatedSection!.name,
    order: updatedSection!.orderIndex,
  });
};

export const deleteComponentSection = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const sectionId = ctx.req.param('sectionId');

  const existingSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, sectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingSection || existingSection.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Section not found' });
  }

  // Move controls in this section back to component root (sectionId = null)
  await db.update(componentControls).set({ sectionId: null }).where(eq(componentControls.sectionId, sectionId));

  await db.delete(componentSections).where(eq(componentSections.id, sectionId));

  return successResponse(ctx, { message: 'Section deleted successfully' }, 200);
};

// Repeatable structure management functions
export const addRepeatableStructureToSection = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const sectionId = ctx.req.param('sectionId');
  const data: CreateRepeatableStructureRequest = await ctx.req.json();
  const { name, description, controls } = data;

  // Verify the section exists and belongs to the component
  const existingSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, sectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingSection || existingSection.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Section not found' });
  }

  // Get current structures count for order
  const existingStructures = await db
    .select()
    .from(repeatableStructures)
    .where(eq(repeatableStructures.sectionId, sectionId));

  // Create the repeatable structure
  const structureId = nanoid();

  await db.insert(repeatableStructures).values({
    id: structureId,
    sectionId,
    name,
    description,
    orderIndex: existingStructures.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create the structure fields
  for (let i = 0; i < controls.length; i++) {
    const control = controls[i];
    const fieldId = nanoid();

    await db.insert(repeatableStructureFields).values({
      id: fieldId,
      structureId,
      name: control.name,
      type: control.type,
      label: control.label,
      placeholder: control.placeholder || null,
      isRequired: control.isRequired || false,
      config: control.config ? JSON.stringify(control.config) : null,
      orderIndex: i,
      createdAt: new Date().toISOString(),
    });
  }

  // Fetch the complete structure with fields
  const newStructure = await db
    .select()
    .from(repeatableStructures)
    .where(eq(repeatableStructures.id, structureId))
    .limit(1)
    .then((rows) => rows[0]);

  const fields = await db
    .select()
    .from(repeatableStructureFields)
    .where(eq(repeatableStructureFields.structureId, structureId))
    .orderBy(repeatableStructureFields.orderIndex);

  const structureData = {
    ...newStructure,
    fields: fields.map((field) => ({
      ...field,
      config: field.config ? JSON.parse(field.config) : {},
    })),
  };

  return successResponse(ctx, structureData, 201);
};

export const updateRepeatableStructure = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const sectionId = ctx.req.param('sectionId');
  const structureId = ctx.req.param('structureId');
  const data: CreateRepeatableStructureRequest = await ctx.req.json();
  const { name, description, controls } = data;

  // Verify the structure exists and belongs to the correct section/component
  const existingStructure = await db
    .select()
    .from(repeatableStructures)
    .where(eq(repeatableStructures.id, structureId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingStructure || existingStructure.sectionId !== sectionId) {
    throw new HTTPException(404, { message: 'Repeatable structure not found' });
  }

  // Verify the section belongs to the component
  const existingSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, sectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingSection || existingSection.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Section not found' });
  }

  // Update the repeatable structure
  await db.update(repeatableStructures).set({
    name,
    description,
    updatedAt: new Date().toISOString(),
  }).where(eq(repeatableStructures.id, structureId));

  // Delete existing fields and create new ones
  await db.delete(repeatableStructureFields).where(eq(repeatableStructureFields.structureId, structureId));

  // Create the updated structure fields
  for (let i = 0; i < controls.length; i++) {
    const control = controls[i];
    const fieldId = nanoid();

    await db.insert(repeatableStructureFields).values({
      id: fieldId,
      structureId,
      name: control.name,
      type: control.type,
      label: control.label,
      placeholder: control.placeholder || null,
      isRequired: control.isRequired || false,
      config: control.config ? JSON.stringify(control.config) : null,
      orderIndex: i,
      createdAt: new Date().toISOString(),
    });
  }

  // Fetch the updated structure with fields
  const updatedStructure = await db
    .select()
    .from(repeatableStructures)
    .where(eq(repeatableStructures.id, structureId))
    .limit(1)
    .then((rows) => rows[0]);

  const fields = await db
    .select()
    .from(repeatableStructureFields)
    .where(eq(repeatableStructureFields.structureId, structureId))
    .orderBy(repeatableStructureFields.orderIndex);

  const structureData = {
    ...updatedStructure,
    fields: fields.map((field) => ({
      ...field,
      config: field.config ? JSON.parse(field.config) : {},
    })),
  };

  return successResponse(ctx, structureData, 200);
};

export const deleteRepeatableStructure = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const sectionId = ctx.req.param('sectionId');
  const structureId = ctx.req.param('structureId');

  // Verify the structure exists and belongs to the correct section/component
  const existingStructure = await db
    .select()
    .from(repeatableStructures)
    .where(eq(repeatableStructures.id, structureId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingStructure || existingStructure.sectionId !== sectionId) {
    throw new HTTPException(404, { message: 'Repeatable structure not found' });
  }

  // Verify the section belongs to the component
  const existingSection = await db
    .select()
    .from(componentSections)
    .where(eq(componentSections.id, sectionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingSection || existingSection.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Section not found' });
  }

  // Delete the repeatable structure (fields will be cascade deleted)
  await db.delete(repeatableStructures).where(eq(repeatableStructures.id, structureId));

  return successResponse(ctx, { message: 'Repeatable structure deleted successfully' }, 200);
};
