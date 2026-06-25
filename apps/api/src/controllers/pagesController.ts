import { eq } from 'drizzle-orm';
import * as fs from 'fs/promises';
import { Context } from 'hono';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { db } from '../db';
import { components, componentSections, fieldsetFields, fieldsets, folders, pages, templates } from '../db/schema';

// Utility function to convert page name to kebab-case
const toKebabCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Utility function to ensure output directory exists
const ensureOutputDir = async () => {
  const outputDir = path.join(process.cwd(), 'public', 'pages');
  try {
    await fs.access(outputDir);
  } catch {
    await fs.mkdir(outputDir, { recursive: true });
  }
  return outputDir;
};

// Utility to convert string to camelCase
const toCamelCase = (str: string): string => {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

// Generate complete page JSON structure
const generatePageJSON = async (pageId: string) => {
  // Get the page
  const pageResult = await db.select().from(pages).where(eq(pages.id, pageId));
  if (pageResult.length === 0 || !pageResult[0]) {
    throw new Error('Page not found');
  }

  const page = pageResult[0];
  const pageMetadata = page.metadata ? JSON.parse(page.metadata) : {};

  // Get template zones if exists
  let templateZones: any[] = [];
  if (page.templateId) {
    const templateResult = await db.select().from(templates).where(eq(templates.id, page.templateId));
    if (templateResult.length > 0 && templateResult[0]) {
      const template = templateResult[0];
      const templateMetadata = template.metadata ? JSON.parse(template.metadata) : {};
      templateZones = templateMetadata.zones || [];
    }
  }

  // Get all components data
  const allComponents = await db.select().from(components);
  const componentSectionsData = await db.select().from(componentSections);
  const fieldsetsData = await db.select().from(fieldsets);
  const fieldsetFieldsData = await db.select().from(fieldsetFields);

  // Build component map with full structure
  const componentMap = new Map();

  for (const component of allComponents) {
    const sections = componentSectionsData
      .filter((section) => section.componentId === component.id)
      .map((section) => {
        const sectionFieldsets = fieldsetsData
          .filter((fieldset) => fieldset.sectionId === section.id)
          .map((fieldset) => {
            const fields = fieldsetFieldsData.filter((field) => field.fieldsetId === fieldset.id);
            return {
              ...fieldset,
              fields,
            };
          });

        return {
          ...section,
          fieldsets: sectionFieldsets,
        };
      });

    componentMap.set(component.id, {
      ...component,
      sections,
    });
  }

  // Merge template zones with page zones
  let allZones: any[] = [];
  if (templateZones.length > 0) {
    allZones = templateZones.map((templateZone: any) => {
      const pageZone = pageMetadata.zones?.find((pz: any) => pz.id === templateZone.id);
      return {
        ...templateZone,
        componentInstances: [...(templateZone.componentInstances || []), ...(pageZone?.componentInstances || [])],
      };
    });
  } else {
    allZones = pageMetadata.zones || [];
  }

  // Flatten structure - create component-based JSON
  const flattenedContent: Record<string, any> = {};
  const componentNameCount: Record<string, number> = {};
  const componentsOrder: string[] = [];

  // Loop through all zones and flatten component instances
  for (const zone of allZones) {
    for (const instance of zone.componentInstances || []) {
      const component = componentMap.get(instance.componentId);
      if (!component) continue;

      const componentName = component.name;
      const config = instance.config || {};

      // Build component content from sections
      const componentContent: Record<string, any> = {};

      if (component.sections && component.sections.length > 0) {
        for (const section of component.sections) {
          const sectionKey = toCamelCase(section.name);
          const sectionData = config[section.name] || {};
          const sectionObject: Record<string, any> = {};

          // Check if section has fieldsets
          if (section.fieldsets && section.fieldsets.length > 0) {
            // Add regular controls to section object
            for (const key in sectionData) {
              // Skip fieldset data, only get regular controls
              if (!section.fieldsets.find((f: any) => f.name === key)) {
                sectionObject[key] = sectionData[key];
              }
            }

            // Add fieldsets as arrays within the section object
            for (const fieldset of section.fieldsets) {
              const fieldsetKey = toCamelCase(fieldset.name);
              const fieldsetData = sectionData[fieldset.name] || [];
              sectionObject[fieldsetKey] = Array.isArray(fieldsetData) ? fieldsetData : [fieldsetData];
            }
          } else {
            // No fieldsets, add all section data
            Object.assign(sectionObject, sectionData);
          }

          // Add section as an object under camelCased section key
          componentContent[sectionKey] = sectionObject;
        }
      } else {
        // No sections, use config directly
        Object.assign(componentContent, config);
      }

      // Generate unique key for component (camelCased)
      let componentKey = toCamelCase(componentName);

      // Check if component name already exists
      const camelComponentName = toCamelCase(componentName);
      if (componentNameCount[camelComponentName]) {
        componentNameCount[camelComponentName]++;
        // Add randomized suffix for duplicate names
        const randomSuffix = `_${nanoid(6)}`;
        componentKey = `${camelComponentName}${randomSuffix}`;
      } else {
        componentNameCount[camelComponentName] = 1;
      }

      flattenedContent[componentKey] = componentContent;
      componentsOrder.push(componentKey);
    }
  }

  // Build final flattened page structure
  return {
    page: {
      id: page.id,
      name: page.name,
      description: page.description,
      slug: pageMetadata.slug || toKebabCase(page.name),
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
    },
    seo: {
      title: pageMetadata.seoTitle || page.name,
      description: pageMetadata.seoDescription || page.description,
      tags: pageMetadata.tags || [],
    },
    componentsOrder,
    content: flattenedContent,
  };
};

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

    // Merge incoming metadata/zones into the existing blob to avoid partial-update data loss
    const existingPage = await db.select().from(pages).where(eq(pages.id, id));
    if (existingPage.length === 0 || !existingPage[0]) {
      return ctx.json({ error: 'Page not found' }, 404);
    }
    const existingMetadata = existingPage[0].metadata ? JSON.parse(existingPage[0].metadata) : {};
    const pageMetadata: any = { ...existingMetadata };
    if (metadata !== undefined) pageMetadata.metadata = metadata;
    if (zones !== undefined) pageMetadata.zones = zones;
    updateData.metadata = JSON.stringify(pageMetadata);

    await db.update(pages).set(updateData).where(eq(pages.id, id));

    // Regenerate static JSON if page is published, delete if unpublished
    const updatedPage = await db.select().from(pages).where(eq(pages.id, id));
    const page = updatedPage[0];

    if (page && page.status === 'published') {
      try {
        const pageJSON = await generatePageJSON(id);
        const outputDir = await ensureOutputDir();
        const kebabName = toKebabCase(pageJSON.page.name);
        const fileName = `${kebabName}.model.json`;
        const filePath = path.join(outputDir, fileName);

        await fs.writeFile(filePath, JSON.stringify(pageJSON, null, 2), 'utf8');

        console.log(`✅ Regenerated static JSON for updated page: ${fileName}`);
      } catch (jsonError) {
        console.error('Error regenerating static JSON:', jsonError);
      }
    } else if (page && (page.status === 'draft' || page.status === 'archived')) {
      // Delete JSON file if page was unpublished — use the stored filename from publish time
      try {
        const parsedMeta = page.metadata ? JSON.parse(page.metadata) : {};
        const fileName = parsedMeta.publishedFileName || `${toKebabCase(page.name)}.model.json`;
        const outputDir = path.join(process.cwd(), 'public', 'pages');
        const filePath = path.join(outputDir, fileName);

        await fs.unlink(filePath);
        console.log(`🗑️ Deleted static JSON file (page unpublished): ${fileName}`);
      } catch (fileError) {
        // File might not exist, ignore
      }
    }

    // Return updated page with zone structure
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

    // Get page name before deletion for JSON file cleanup
    const pageToDelete = await db.select().from(pages).where(eq(pages.id, id));

    if (pageToDelete.length > 0 && pageToDelete[0]) {
      const page = pageToDelete[0];

      // Delete static JSON file if it exists
      try {
        const parsedMeta = page.metadata ? JSON.parse(page.metadata) : {};
        const fileName = parsedMeta.publishedFileName || `${toKebabCase(page.name)}.model.json`;
        const outputDir = path.join(process.cwd(), 'public', 'pages');
        const filePath = path.join(outputDir, fileName);

        await fs.unlink(filePath);
        console.log(`🗑️ Deleted static JSON file: ${fileName}`);
      } catch (fileError) {
        // File might not exist, ignore error
        console.log('No static JSON file to delete or already deleted');
      }
    }

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

    const existingPage = await db.select().from(pages).where(eq(pages.id, id));
    if (existingPage.length === 0 || !existingPage[0]) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    const updateData = {
      status: 'published' as const,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.update(pages).set(updateData).where(eq(pages.id, id));

    // Generate static JSON file for the published page and record the filename in metadata
    try {
      const pageJSON = await generatePageJSON(id);
      const outputDir = await ensureOutputDir();
      const kebabName = toKebabCase(pageJSON.page.name);
      const fileName = `${kebabName}.model.json`;
      const filePath = path.join(outputDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(pageJSON, null, 2), 'utf8');

      // Store the published filename so cleanup can find it even after a rename
      const publishedPage = await db.select().from(pages).where(eq(pages.id, id));
      if (publishedPage[0]) {
        const currentMetadata = publishedPage[0].metadata ? JSON.parse(publishedPage[0].metadata) : {};
        await db.update(pages).set({
          metadata: JSON.stringify({ ...currentMetadata, publishedFileName: fileName }),
        }).where(eq(pages.id, id));
      }

      console.log(`✅ Generated static JSON for page: ${fileName}`);
    } catch (jsonError) {
      console.error('Error generating static JSON:', jsonError);
      // Don't fail the publish if JSON generation fails
    }

    const updatedPage = await db.select().from(pages).where(eq(pages.id, id));
    if (!updatedPage[0]) {
      return ctx.json({ error: 'Page not found' }, 404);
    }
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

// Update component instance content within a page
export const updatePageInstance = async (ctx: Context) => {
  try {
    const pageId = ctx.req.param('id');
    const instanceId = ctx.req.param('instanceId');
    const { content } = await ctx.req.json();

    // Get the page
    const pageResult = await db.select().from(pages).where(eq(pages.id, pageId));
    if (pageResult.length === 0) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    const page = pageResult[0];
    if (!page) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    // Parse metadata
    const metadata = page.metadata ? JSON.parse(page.metadata) : {};
    const zones = metadata.zones || [];

    console.log('Looking for instance:', instanceId);
    console.log('Page zones:', JSON.stringify(zones, null, 2));

    // Find and update the component instance
    let instanceFound = false;
    const updatedZones = zones.map((zone: any) => ({
      ...zone,
      componentInstances: (zone.componentInstances || []).map((instance: any) => {
        console.log('Checking instance:', instance.id || instance);
        if (instance.id === instanceId) {
          instanceFound = true;
          return { ...instance, config: content };
        }
        return instance;
      }),
    }));

    if (!instanceFound) {
      console.log(
        'Instance not found. Available instances:',
        zones.flatMap((z: any) => (z.componentInstances || []).map((i: any) => i.id || 'no-id')),
      );
      return ctx.json(
        {
          error: 'Component instance not found. Please save the page first before editing component content.',
          instanceId,
          availableInstances: zones.flatMap((z: any) => (z.componentInstances || []).map((i: any) => i.id || 'no-id')),
        },
        404,
      );
    }

    // Update page metadata
    const updatedMetadata = {
      ...metadata,
      zones: updatedZones,
    };

    await db
      .update(pages)
      .set({
        metadata: JSON.stringify(updatedMetadata),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(pages.id, pageId));

    // Regenerate and write static JSON if page is published
    if (page.status === 'published') {
      try {
        const pageJSON = await generatePageJSON(pageId);
        const outputDir = await ensureOutputDir();
        const kebabName = toKebabCase(pageJSON.page.name);
        const fileName = `${kebabName}.model.json`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, JSON.stringify(pageJSON, null, 2), 'utf8');
        console.log(`✅ Regenerated static JSON for updated instance: ${fileName}`);
      } catch (jsonError) {
        console.error('Error regenerating static JSON:', jsonError);
      }
    }

    return ctx.json({ message: 'Instance updated successfully', page: { ...page, metadata: updatedMetadata } });
  } catch (error) {
    console.error('Error updating page instance:', error);
    return ctx.json({ error: 'Failed to update instance' }, 500);
  }
};

// Serve static page JSON files
export const servePageJSON = async (ctx: Context) => {
  try {
    const fileName = ctx.req.param('filename'); // e.g., "home-page.model.json"
    const outputDir = path.join(process.cwd(), 'public', 'pages');
    const filePath = path.join(outputDir, fileName);

    try {
      const jsonContent = await fs.readFile(filePath, 'utf8');
      const pageData = JSON.parse(jsonContent);

      ctx.header('Content-Type', 'application/json');
      ctx.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return ctx.json(pageData);
    } catch (fileError) {
      return ctx.json({ error: 'Page not found or not published' }, 404);
    }
  } catch (error) {
    console.error('Error serving page JSON:', error);
    return ctx.json({ error: 'Failed to serve page' }, 500);
  }
};
