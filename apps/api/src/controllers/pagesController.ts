import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { componentInstances, folders, pages } from '../db/schema';

export const getAllPages = async (ctx: Context) => {
  try {
    const allPages = await db.select().from(pages);
    return ctx.json(allPages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return ctx.json({ error: 'Failed to fetch pages' }, 500);
  }
};

export const getPageById = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const page = await db.select().from(pages).where(eq(pages.id, id));

    if (page.length === 0) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    // Get component instances for this page
    const instances = await db.select().from(componentInstances).where(eq(componentInstances.pageId, id));

    const pageWithInstances = {
      ...page[0],
      componentInstances: instances.map((instance) => ({
        ...instance,
        position: JSON.parse(instance.position),
        size: instance.size ? JSON.parse(instance.size) : undefined,
        config: JSON.parse(instance.config),
      })),
    };

    return ctx.json(pageWithInstances);
  } catch (error) {
    console.error('Error fetching page:', error);
    return ctx.json({ error: 'Failed to fetch page' }, 500);
  }
};

export const createPage = async (ctx: Context) => {
  try {
    const { name, description, folderId, templateId, metadata } = await ctx.req.json();
    const id = nanoid();

    const newPage = {
      id,
      name,
      description,
      folderId,
      templateId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };

    await db.insert(pages).values(newPage);
    return ctx.json({ ...newPage, componentInstances: [] }, 201);
  } catch (error) {
    console.error('Error creating page:', error);
    return ctx.json({ error: 'Failed to create page' }, 500);
  }
};

export const updatePage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const { name, description, status, folderId, templateId, metadata } = await ctx.req.json();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (templateId !== undefined) updateData.templateId = templateId;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    await db.update(pages).set(updateData).where(eq(pages.id, id));

    const updatedPage = await db.select().from(pages).where(eq(pages.id, id));
    return ctx.json(updatedPage[0]);
  } catch (error) {
    console.error('Error updating page:', error);
    return ctx.json({ error: 'Failed to update page' }, 500);
  }
};

export const deletePage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    // Delete all component instances first
    await db.delete(componentInstances).where(eq(componentInstances.pageId, id));

    // Delete the page
    await db.delete(pages).where(eq(pages.id, id));

    return ctx.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return ctx.json({ error: 'Failed to delete page' }, 500);
  }
};

export const publishPage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    const updateData = {
      status: 'published' as const,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.update(pages).set(updateData).where(eq(pages.id, id));

    const updatedPage = await db.select().from(pages).where(eq(pages.id, id));
    return ctx.json(updatedPage[0]);
  } catch (error) {
    console.error('Error publishing page:', error);
    return ctx.json({ error: 'Failed to publish page' }, 500);
  }
};

// Add component instance to page
export const addComponentToPage = async (ctx: Context) => {
  try {
    const pageId = ctx.req.param('id');
    const { componentId, position, size, config, orderIndex } = await ctx.req.json();
    const id = nanoid();

    const newInstance = {
      id,
      componentId,
      pageId,
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
    console.error('Error adding component to page:', error);
    return ctx.json({ error: 'Failed to add component to page' }, 500);
  }
};

// Folder management
export const getAllFolders = async (ctx: Context) => {
  try {
    const allFolders = await db.select().from(folders);
    return ctx.json(allFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return ctx.json({ error: 'Failed to fetch folders' }, 500);
  }
};

export const createFolder = async (ctx: Context) => {
  try {
    const { name, description, parentId } = await ctx.req.json();
    const id = nanoid();

    const newFolder = {
      id,
      name,
      description,
      parentId,
    };

    await db.insert(folders).values(newFolder);
    return ctx.json(newFolder, 201);
  } catch (error) {
    console.error('Error creating folder:', error);
    return ctx.json({ error: 'Failed to create folder' }, 500);
  }
};

export const deleteFolder = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    // Check if folder has pages (prevent deletion if it does)
    const pagesInFolder = await db.select().from(pages).where(eq(pages.folderId, id));
    if (pagesInFolder.length > 0) {
      return ctx.json({ error: 'Cannot delete folder that contains pages' }, 400);
    }

    await db.delete(folders).where(eq(folders.id, id));
    return ctx.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return ctx.json({ error: 'Failed to delete folder' }, 500);
  }
};
