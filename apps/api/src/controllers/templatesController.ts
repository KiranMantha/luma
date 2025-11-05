import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { componentInstances, templates } from '../db/schema';

export const getAllTemplates = async (ctx: Context) => {
  try {
    const allTemplates = await db.select().from(templates);
    return ctx.json(allTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return ctx.json({ error: 'Failed to fetch templates' }, 500);
  }
};

export const getTemplateById = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const template = await db.select().from(templates).where(eq(templates.id, id));

    if (template.length === 0) {
      return ctx.json({ error: 'Template not found' }, 404);
    }

    // Get component instances for this template
    const instances = await db.select().from(componentInstances).where(eq(componentInstances.templateId, id));

    const templateWithInstances = {
      ...template[0],
      componentInstances: instances.map((instance) => ({
        ...instance,
        position: JSON.parse(instance.position),
        size: instance.size ? JSON.parse(instance.size) : undefined,
        config: JSON.parse(instance.config),
      })),
    };

    return ctx.json(templateWithInstances);
  } catch (error) {
    console.error('Error fetching template:', error);
    return ctx.json({ error: 'Failed to fetch template' }, 500);
  }
};

export const createTemplate = async (ctx: Context) => {
  try {
    const { name, description, metadata } = await ctx.req.json();
    const id = nanoid();

    const newTemplate = {
      id,
      name,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };

    await db.insert(templates).values(newTemplate);
    return ctx.json({ ...newTemplate, componentInstances: [] }, 201);
  } catch (error) {
    console.error('Error creating template:', error);
    return ctx.json({ error: 'Failed to create template' }, 500);
  }
};

export const updateTemplate = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const { name, description, metadata } = await ctx.req.json();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    await db.update(templates).set(updateData).where(eq(templates.id, id));

    const updatedTemplate = await db.select().from(templates).where(eq(templates.id, id));
    return ctx.json(updatedTemplate[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    return ctx.json({ error: 'Failed to update template' }, 500);
  }
};

export const deleteTemplate = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    // Delete all component instances first (cascade should handle this, but being explicit)
    await db.delete(componentInstances).where(eq(componentInstances.templateId, id));

    // Delete the template
    await db.delete(templates).where(eq(templates.id, id));

    return ctx.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return ctx.json({ error: 'Failed to delete template' }, 500);
  }
};

// Add component instance to template
export const addComponentToTemplate = async (ctx: Context) => {
  try {
    const templateId = ctx.req.param('id');
    const { componentId, position, size, config, orderIndex } = await ctx.req.json();
    const id = nanoid();

    const newInstance = {
      id,
      componentId,
      templateId,
      position: JSON.stringify(position),
      size: size ? JSON.stringify(size) : null,
      config: JSON.stringify(config),
      orderIndex,
    };

    await db.insert(componentInstances).values(newInstance);

    return ctx.json(
      {
        ...newInstance,
        position: JSON.parse(newInstance.position),
        size: newInstance.size ? JSON.parse(newInstance.size) : undefined,
        config: JSON.parse(newInstance.config),
      },
      201,
    );
  } catch (error) {
    console.error('Error adding component to template:', error);
    return ctx.json({ error: 'Failed to add component to template' }, 500);
  }
};
