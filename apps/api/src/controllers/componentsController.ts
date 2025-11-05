import { desc, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { componentControls, components, componentSections } from '../db/schema';
import type {
  CreateComponentControlRequest,
  CreateComponentRequest,
  UpdateComponentControlRequest,
  UpdateComponentRequest,
} from '../types/component';
import { successResponse } from '../types/response';

export const getAllComponents = async (ctx: Context) => {
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
    const sectionsWithControls = sections.map((section) => ({
      id: section.id,
      name: section.name,
      order: section.orderIndex,
      controls: parsedControls.filter((control) => control.sectionId === section.id),
    }));

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
