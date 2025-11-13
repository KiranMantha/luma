import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { templates } from '../db/schema';

export const getAllTemplates = async (ctx: Context) => {
  try {
    const allTemplates = await db.select().from(templates);

    // Parse metadata for each template to get zones
    const cleanTemplates = allTemplates.map((template) => {
      const metadata = template?.metadata ? JSON.parse(template.metadata) : {};

      return {
        ...template,
        layout: metadata.layout,
        zones: metadata.zones || [],
        metadata: metadata.metadata || {},
      };
    });

    return ctx.json(cleanTemplates);
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

    // Parse metadata to get layout and zones
    const templateData = template[0];
    const metadata = templateData?.metadata ? JSON.parse(templateData.metadata) : {};

    // Return clean zone-based template structure
    const cleanTemplate = {
      ...templateData,
      layout: metadata.layout || 'header-footer',
      zones: metadata.zones || [],
      metadata: metadata.metadata || {},
    };
    return ctx.json(cleanTemplate);
  } catch (error) {
    console.error('Error fetching template:', error);
    return ctx.json({ error: 'Failed to fetch template' }, 500);
  }
};

export const createTemplate = async (ctx: Context) => {
  try {
    const { name, description, layout, zones, metadata } = await ctx.req.json();
    const id = nanoid();

    // Create template metadata with zones
    const templateMetadata: any = {};
    if (metadata) templateMetadata.metadata = metadata;
    if (layout) templateMetadata.layout = layout;
    if (zones) templateMetadata.zones = zones;

    const newTemplate = {
      id,
      name,
      description,
      metadata: Object.keys(templateMetadata).length > 0 ? JSON.stringify(templateMetadata) : null,
    };

    await db.insert(templates).values(newTemplate);

    // Return clean zone-based template
    return ctx.json(
      {
        ...newTemplate,
        layout: layout || 'header-footer',
        zones: zones || [],
        metadata: metadata || {},
      },
      201,
    );
  } catch (error) {
    console.error('Error creating template:', error);
    return ctx.json({ error: 'Failed to create template' }, 500);
  }
};

export const updateTemplate = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const body = await ctx.req.json();
    const { name, description, metadata, layout, zones } = body;

    // Update template metadata
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Store layout and zones in metadata for zone-based templates
    const templateMetadata: any = {};
    if (metadata) templateMetadata.metadata = metadata;
    if (layout) templateMetadata.layout = layout;
    if (zones) templateMetadata.zones = zones;

    if (Object.keys(templateMetadata).length > 0) {
      updateData.metadata = JSON.stringify(templateMetadata);
    }

    await db.update(templates).set(updateData).where(eq(templates.id, id));

    // Zone-based templates store all component info in metadata - no separate component instances needed

    // Return updated template with zone structure
    const updatedTemplate = await db.select().from(templates).where(eq(templates.id, id));
    const template = updatedTemplate[0];
    const parsedMetadata = template?.metadata ? JSON.parse(template.metadata) : {};

    const cleanTemplate = {
      ...template,
      layout: parsedMetadata.layout || 'header-footer',
      zones: parsedMetadata.zones || [],
      metadata: parsedMetadata.metadata || {},
    };
    return ctx.json(cleanTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    return ctx.json({ error: 'Failed to update template' }, 500);
  }
};

export const deleteTemplate = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    // Zone-based templates store everything in metadata - just delete the template
    await db.delete(templates).where(eq(templates.id, id));

    return ctx.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return ctx.json({ error: 'Failed to delete template' }, 500);
  }
};
