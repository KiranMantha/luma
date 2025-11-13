import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { folders, pages } from '../db/schema';

export const getAllPages = async (ctx: Context) => {
  try {
    const allPages = await db.select().from(pages);

    // Parse metadata for each page to get zones
    const cleanPages = allPages.map((page) => {
      const metadata = page?.metadata ? JSON.parse(page.metadata) : {};

      return {
        ...page,
        zones: metadata.zones || [
          {
            id: 'body',
            name: 'Body',
            type: 'content',
            componentInstances: [],
            policy: { maxComponents: null, locked: false },
          },
        ],
        metadata: metadata.metadata || {},
      };
    });

    return ctx.json(cleanPages);
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

    // Parse metadata to get zones
    const pageData = page[0];
    const metadata = pageData?.metadata ? JSON.parse(pageData.metadata) : {};

    // Return clean zone-based page structure
    const cleanPage = {
      ...pageData,
      zones: metadata.zones || [
        {
          id: 'body',
          name: 'Body',
          type: 'content',
          componentInstances: [],
          policy: { maxComponents: null, locked: false },
        },
      ],
      metadata: metadata.metadata || {},
    };

    return ctx.json(cleanPage);
  } catch (error) {
    console.error('Error fetching page:', error);
    return ctx.json({ error: 'Failed to fetch page' }, 500);
  }
};

export const createPage = async (ctx: Context) => {
  try {
    const { name, description, folderId, templateId, zones, metadata } = await ctx.req.json();
    const id = nanoid();

    // Create page metadata with zones
    const pageMetadata: any = {};
    if (metadata) pageMetadata.metadata = metadata;
    if (zones) {
      pageMetadata.zones = zones;
    } else {
      // Default body zone for pages
      pageMetadata.zones = [
        {
          id: 'body',
          name: 'Body',
          type: 'content',
          componentInstances: [],
          policy: { maxComponents: null, locked: false },
        },
      ];
    }

    const newPage = {
      id,
      name,
      description,
      folderId,
      templateId,
      metadata: Object.keys(pageMetadata).length > 0 ? JSON.stringify(pageMetadata) : null,
    };

    await db.insert(pages).values(newPage);

    // Return clean zone-based page
    return ctx.json(
      {
        ...newPage,
        zones: pageMetadata.zones || [],
        metadata: metadata || {},
      },
      201,
    );
  } catch (error) {
    console.error('Error creating page:', error);
    return ctx.json({ error: 'Failed to create page' }, 500);
  }
};

export const updatePage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const body = await ctx.req.json();
    const { name, description, status, folderId, templateId, metadata, zones } = body;

    // Update page metadata
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (templateId !== undefined) updateData.templateId = templateId;

    // Store zones in metadata for zone-based pages
    const pageMetadata: any = {};
    if (metadata) pageMetadata.metadata = metadata;
    if (zones) pageMetadata.zones = zones;

    if (Object.keys(pageMetadata).length > 0) {
      updateData.metadata = JSON.stringify(pageMetadata);
    }

    await db.update(pages).set(updateData).where(eq(pages.id, id));

    // Zone-based pages store all component info in metadata - no separate component instances needed

    // Return updated page with zone structure
    const updatedPage = await db.select().from(pages).where(eq(pages.id, id));
    const page = updatedPage[0];
    const parsedMetadata = page?.metadata ? JSON.parse(page.metadata) : {};

    const cleanPage = {
      ...page,
      zones: parsedMetadata.zones || [
        {
          id: 'body',
          name: 'Body',
          type: 'content',
          componentInstances: [],
          policy: { maxComponents: null, locked: false },
        },
      ],
      metadata: parsedMetadata.metadata || {},
    };

    return ctx.json(cleanPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return ctx.json({ error: 'Failed to update page' }, 500);
  }
};

export const deletePage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    // Zone-based pages store everything in metadata - just delete the page
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

// Pages now use zone-based architecture like templates
// Components are managed through the updatePage endpoint

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
