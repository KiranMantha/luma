import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs/promises';
import { Context } from 'hono';
import { nanoid } from 'nanoid';
import * as path from 'path';
import { db } from '../db';
import { componentControls, components, componentSections, draftPages, fieldsetFields, fieldsets, folders, pages, projectSettings, templates } from '../db/schema';

// Utility function to convert page name to kebab-case
const toKebabCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Resolve the pages output dir — configurable via PUBLIC_PAGES_DIR env var so the
// API can write directly into the CMS's public/pages folder for static serving.
const ensureOutputDir = async () => {
  const configured = process.env.PUBLIC_PAGES_DIR;
  const outputDir = configured
    ? path.resolve(process.cwd(), configured)
    : path.join(process.cwd(), 'public', 'pages');
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
};

// Utility to convert string to camelCase
const toCamelCase = (str: string): string => {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

// Resolve a single component instance's raw config (keyed by opaque IDs) into the
// structured shape: { id, type, name, <sectionName>: { <fieldLabel>: value, <fieldsetName>: [{<fieldLabel>: value}] } }
const resolveInstanceContent = async (instance: any, projectName?: string | null): Promise<any> => {
  const componentResult = await db.select().from(components).where(eq(components.id, instance.componentId));
  const component = componentResult[0];
  if (!component) return { id: instance.id, componentId: instance.componentId, config: instance.config, order: instance.order };

  const config: Record<string, any> =
    typeof instance.config === 'string' ? JSON.parse(instance.config) : instance.config || {};

  const sectionsResult = await db.select().from(componentSections).where(eq(componentSections.componentId, component.id));
  const controlsResult = await db.select().from(componentControls).where(eq(componentControls.componentId, component.id));

  const sectionIds = sectionsResult.map((s) => s.id);
  const fieldsetsResult = sectionIds.length > 0
    ? await db.select().from(fieldsets).where(inArray(fieldsets.sectionId, sectionIds))
    : [];
  const fieldsetIds = fieldsetsResult.map((f) => f.id);
  const fieldsetFieldsResult = fieldsetIds.length > 0
    ? await db.select().from(fieldsetFields).where(inArray(fieldsetFields.fieldsetId, fieldsetIds))
    : [];

  const componentType = toCamelCase(component.name);
  const type = projectName
    ? `${toKebabCase(projectName)}/components/${componentType}`
    : componentType;

  const resolved: Record<string, any> = {
    id: instance.id,
    componentId: component.id,
    type,
    name: component.name,
    order: instance.order,
  };

  for (const section of sectionsResult) {
    const sectionKey = toCamelCase(section.name);
    const sectionObj: Record<string, any> = {};

    // Individual controls — config key is control.id, output key is camelCased label
    const sectionControls = controlsResult.filter((c) => c.sectionId === section.id);
    for (const control of sectionControls) {
      if (config[control.id] !== undefined) {
        sectionObj[toCamelCase(control.label || control.id)] = config[control.id];
      }
    }

    // Fieldsets — config key is "<sectionId>:<fieldset.name>" (scoped to avoid collisions
    // when multiple sections share a fieldset name). Falls back to un-scoped fieldset.name
    // for configs saved before this scoping was introduced.
    const sectionFieldsets = fieldsetsResult.filter((f) => f.sectionId === section.id);
    for (const fieldset of sectionFieldsets) {
      const fieldsetKey = toCamelCase(fieldset.name);
      const scopedConfigKey = `${section.id}:${fieldset.name}`;
      const raw = config[scopedConfigKey] ?? config[fieldset.name];
      const fields = fieldsetFieldsResult.filter((f) => f.fieldsetId === fieldset.id);

      if (Array.isArray(raw)) {
        sectionObj[fieldsetKey] = raw.map((item: Record<string, any>) => {
          const mapped: Record<string, any> = {};
          for (const field of fields) {
            if (item[field.id] !== undefined) mapped[toCamelCase(field.label)] = item[field.id];
          }
          return mapped;
        });
      } else {
        sectionObj[fieldsetKey] = [];
      }
    }

    resolved[sectionKey] = sectionObj;
  }

  return resolved;
};

// Merge template zones with page zones so locked/header/footer zones from the template
// are included alongside the editable page zones.
const mergeZones = async (pageRow: { templateId: string | null; metadata: string | null }) => {
  const pageMetadata = pageRow.metadata ? JSON.parse(pageRow.metadata) : {};
  const pageZones: any[] = pageMetadata.zones || [
    { id: 'body', name: 'Body', type: 'content', componentInstances: [], policy: { maxComponents: null, locked: false } },
  ];

  const settingsRows = await db.select().from(projectSettings);
  const projectName = settingsRows.find((r) => r.key === 'project_name')?.value ?? null;

  const resolveZones = (zones: any[]) =>
    Promise.all(
      zones.map(async (zone: any) => {
        const { componentInstances, ...zoneRest } = zone;
        return {
          ...zoneRest,
          components: await Promise.all(
            (componentInstances || []).map((inst: any) => resolveInstanceContent(inst, projectName)),
          ),
        };
      }),
    );

  if (!pageRow.templateId) return resolveZones(pageZones);

  const templateResult = await db.select().from(templates).where(eq(templates.id, pageRow.templateId));
  if (templateResult.length === 0 || !templateResult[0]) return resolveZones(pageZones);

  const templateMetadata = templateResult[0].metadata ? JSON.parse(templateResult[0].metadata) : {};
  const templateZones: any[] = templateMetadata.zones || [];
  if (templateZones.length === 0) return resolveZones(pageZones);

  // Merge template zones with matching page zones; append page-only zones (e.g. body) afterward.
  const merged = templateZones.map((tz: any) => {
    const pageZone = pageZones.find((pz: any) => pz.id === tz.id);
    return {
      ...tz,
      componentInstances: [...(tz.componentInstances || []), ...(pageZone?.componentInstances || [])],
    };
  });

  const templateZoneIds = new Set(templateZones.map((tz: any) => tz.id));
  for (const pz of pageZones) {
    if (!templateZoneIds.has(pz.id)) merged.push(pz);
  }

  return resolveZones(merged);
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

      // Build component content from sections.
      // config is stored flat: { [controlId]: value, [fieldsetName]: [{...}] }
      const componentContent: Record<string, any> = {};

      if (component.sections && component.sections.length > 0) {
        for (const section of component.sections) {
          const sectionKey = toCamelCase(section.name);
          const sectionObject: Record<string, any> = {};

          // Regular controls — keyed by control.id in config
          for (const control of section.controls || []) {
            if (config[control.id] !== undefined) {
              sectionObject[toCamelCase(control.label || control.id)] = config[control.id];
            }
          }

          // Fieldsets — scoped key "<sectionId>:<fieldsetName>" avoids collision across sections
          for (const fieldset of section.fieldsets || []) {
            const fieldsetKey = toCamelCase(fieldset.name);
            const scopedConfigKey = `${section.id}:${fieldset.name}`;
            const fieldsetData = config[scopedConfigKey] ?? config[fieldset.name] ?? [];
            sectionObject[fieldsetKey] = Array.isArray(fieldsetData) ? fieldsetData : [fieldsetData];
          }

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
    const allDrafts = await db.select().from(draftPages);
    const draftPageIds = new Set(allDrafts.map((d) => d.pageId));

    const cleanPages = allPages.map((page) => {
      const metadata = page?.metadata ? JSON.parse(page.metadata) : {};

      return {
        ...page,
        slug: metadata.slug || toKebabCase(page.name),
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
        hasDraft: draftPageIds.has(page.id),
      };
    });

    return ctx.json(cleanPages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return ctx.json({ error: 'Failed to fetch pages' }, 500);
  }
};

// Collect all resolved components from every zone, sorted by order.
const flattenComponents = (zones: any[]): any[] =>
  zones.flatMap((z) => z.components || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const buildPageResponse = (pageRow: any, metadata: any, components: any[]) => ({
  id: pageRow.id,
  name: pageRow.name,
  description: pageRow.description,
  slug: metadata.slug || toKebabCase(pageRow.name),
  status: pageRow.status,
  templateId: pageRow.templateId,
  publishedAt: pageRow.publishedAt,
  updatedAt: pageRow.updatedAt,
  components,
});

// Write <slug>.model.json to the configured output dir — called after every page save.
// Uses the same pipeline as getPageBySlug so the static file matches the live API response.
const writePageModelJSON = async (pageId: string) => {
  const pageResult = await db.select().from(pages).where(eq(pages.id, pageId));
  const pageRow = pageResult[0];
  if (!pageRow) throw new Error('Page not found');

  const metadata = pageRow.metadata ? JSON.parse(pageRow.metadata) : {};
  const zones = await mergeZones(pageRow);
  const components = flattenComponents(zones);
  const pageModel = buildPageResponse(pageRow, metadata, components);

  const outputDir = await ensureOutputDir();
  const fileName = `${pageModel.slug}.model.json`;
  await fs.writeFile(path.join(outputDir, fileName), JSON.stringify(pageModel, null, 2), 'utf8');
  console.log(`✅ Written ${fileName}`);
  return fileName;
};

export const getPageBySlug = async (ctx: Context) => {
  try {
    const slug = ctx.req.param('slug');
    const allPages = await db.select().from(pages);
    const matched = allPages.find((p) => {
      const meta = p.metadata ? JSON.parse(p.metadata) : {};
      const pageSlug = meta.slug || toKebabCase(p.name);
      return pageSlug === slug;
    });

    if (!matched) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    const metadata = matched.metadata ? JSON.parse(matched.metadata) : {};
    const zones = await mergeZones(matched);
    return ctx.json(buildPageResponse(matched, metadata, flattenComponents(zones)));
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    return ctx.json({ error: 'Failed to fetch page' }, 500);
  }
};

// Returns raw zones + componentInstances for the CMS page editor.
// Checks draft_pages first; if a draft exists for this page, returns that data.
export const getPageForEdit = async (ctx: Context) => {
  try {
    const slug = ctx.req.param('slug');
    const allPages = await db.select().from(pages);
    const matched = allPages.find((p) => {
      const meta = p.metadata ? JSON.parse(p.metadata) : {};
      return (meta.slug || toKebabCase(p.name)) === slug;
    });

    if (!matched) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    // Check if a draft exists for this page
    const draftResult = await db.select().from(draftPages).where(eq(draftPages.pageId, matched.id));
    const draft = draftResult[0];
    const hasDraft = !!draft;

    // Use draft data if available, otherwise fall back to published page data
    const activeRow = draft ?? matched;
    const activeMetadata = activeRow.metadata ? JSON.parse(activeRow.metadata) : {};

    return ctx.json({
      ...matched,           // base page fields (id, templateId, folderId, etc.)
      name: activeRow.name,
      description: activeRow.description,
      status: activeRow.status,
      slug: activeMetadata.slug || toKebabCase(activeRow.name),
      zones: activeMetadata.zones || [],
      metadata: activeMetadata.metadata || {},
      hasDraft,
    });
  } catch (error) {
    console.error('Error fetching page for edit:', error);
    return ctx.json({ error: 'Failed to fetch page' }, 500);
  }
};

export const createPage = async (ctx: Context) => {
  try {
    const { name, slug, description, folderId, templateId, zones, metadata } = await ctx.req.json();
    const id = nanoid();

    const pageMetadata: any = {};
    pageMetadata.slug = slug || toKebabCase(name);
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

    // Write initial model.json so CMS can serve it immediately
    try {
      await writePageModelJSON(id);
    } catch (jsonError) {
      console.error('Error writing page model JSON:', jsonError);
    }

    return ctx.json(
      {
        ...newPage,
        slug: pageMetadata.slug,
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

    // Always regenerate model.json so CMS static files stay current
    try {
      await writePageModelJSON(id);
    } catch (jsonError) {
      console.error('Error writing page model JSON:', jsonError);
    }

    // Return updated page with zone structure
    const updatedRow = { ...existingPage[0], ...updateData };
    const parsedMetadata = JSON.parse(updatedRow.metadata ?? '{}');

    return ctx.json({
      ...updatedRow,
      slug: parsedMetadata.slug || toKebabCase(updatedRow.name),
      zones: parsedMetadata.zones || [],
      metadata: parsedMetadata.metadata || {},
    });
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
        const slug = parsedMeta.slug || toKebabCase(page.name);
        const fileName = `${slug}.model.json`;
        const outputDir = await ensureOutputDir();
        await fs.unlink(path.join(outputDir, fileName));
        console.log(`🗑️ Deleted ${fileName}`);
      } catch {
        // File might not exist — ignore
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

// Upsert a draft row into draft_pages. Published pages row is never touched.
export const saveDraft = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const { zones, metadata: extraMeta } = await ctx.req.json();

    const pageResult = await db.select().from(pages).where(eq(pages.id, id));
    const pageRow = pageResult[0];
    if (!pageRow) return ctx.json({ error: 'Page not found' }, 404);

    // Merge with published metadata so slug and other non-zone fields are preserved
    const publishedMeta = pageRow.metadata ? JSON.parse(pageRow.metadata) : {};
    const draftMeta: Record<string, unknown> = { ...publishedMeta };
    if (zones !== undefined) draftMeta.zones = zones;
    if (extraMeta !== undefined) draftMeta.metadata = extraMeta;

    // Upsert: remove any existing draft for this page, then insert the new one
    await db.delete(draftPages).where(eq(draftPages.pageId, id));
    await db.insert(draftPages).values({
      id: nanoid(),
      pageId: id,
      name: pageRow.name,
      description: pageRow.description,
      status: 'draft',
      folderId: pageRow.folderId,
      templateId: pageRow.templateId,
      metadata: JSON.stringify(draftMeta),
      updatedAt: new Date().toISOString(),
    });

    return ctx.json({
      ...pageRow,
      slug: draftMeta.slug as string || toKebabCase(pageRow.name),
      zones: (draftMeta.zones as any[]) || [],
      metadata: (draftMeta.metadata as object) || {},
      hasDraft: true,
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return ctx.json({ error: 'Failed to save draft' }, 500);
  }
};

// Promote draft → published using the 3-step atomic swap:
// 1. Delete existing pages row
// 2. Insert new pages row from draftPages data
// 3. Delete the draftPages row
// Falls back to publishing current pages row as-is when no draft exists.
export const publishPage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    const pageResult = await db.select().from(pages).where(eq(pages.id, id));
    const pageRow = pageResult[0];
    if (!pageRow) return ctx.json({ error: 'Page not found' }, 404);

    const draftResult = await db.select().from(draftPages).where(eq(draftPages.pageId, id));
    const draft = draftResult[0];

    if (draft) {
      const now = new Date().toISOString();
      // Step 1 — remove the existing published row
      await db.delete(pages).where(eq(pages.id, id));
      // Step 2 — insert a fresh published row from the draft's data
      await db.insert(pages).values({
        id,                           // keep the same page id
        name: draft.name,
        description: draft.description,
        status: 'published',
        folderId: draft.folderId,
        templateId: draft.templateId,
        createdAt: pageRow.createdAt,  // preserve original creation date
        updatedAt: now,
        publishedAt: now,
        metadata: draft.metadata,
      });
      // Step 3 — delete the draft row
      await db.delete(draftPages).where(eq(draftPages.pageId, id));
    } else {
      // No draft — just flip status on the existing row
      await db.update(pages).set({
        status: 'published',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(pages.id, id));
    }

    try {
      await writePageModelJSON(id);
    } catch (jsonError) {
      console.error('Error writing page model JSON:', jsonError);
    }

    const updatedPage = await db.select().from(pages).where(eq(pages.id, id));
    if (!updatedPage[0]) return ctx.json({ error: 'Page not found' }, 404);
    const meta = updatedPage[0].metadata ? JSON.parse(updatedPage[0].metadata) : {};
    return ctx.json({
      ...updatedPage[0],
      slug: meta.slug || toKebabCase(updatedPage[0].name),
      zones: meta.zones || [],
      hasDraft: false,
    });
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

// Build full pageModel payload in the shape the remote app expects:
// { pageId, slug, zones: ZoneInfo[], components: ComponentData[] }
// Prefers draft_pages data when a draft exists for this pageId.
const buildPageModelPayload = async (pageId: string) => {
  const pageResult = await db.select().from(pages).where(eq(pages.id, pageId));
  const pageRow = pageResult[0];
  if (!pageRow) throw new Error('Page not found');

  // Check for an active draft
  const draftResult = await db.select().from(draftPages).where(eq(draftPages.pageId, pageId));
  const draft = draftResult[0];

  // Use draft metadata when available; mergeZones expects a row with metadata field
  const rowForMerge = draft
    ? { ...pageRow, metadata: draft.metadata, templateId: draft.templateId }
    : pageRow;
  const metadata = rowForMerge.metadata ? JSON.parse(rowForMerge.metadata) : {};
  const resolvedZones = await mergeZones(rowForMerge);

  const zoneInfos = resolvedZones.map((z: any) => ({
    id: z.id,
    name: z.name,
    type: z.type,
    order: z.order ?? 0,
    maxComponents: z.policy?.maxComponents ?? null,
    locked: z.policy?.locked ?? false,
  }));

  const components: any[] = [];
  resolvedZones.forEach((z: any) => {
    (z.components || []).forEach((c: any) => {
      components.push({
        id: c.id,
        componentId: c.componentId,
        type: c.type,
        zoneId: z.id,
        order: c.order ?? 0,
        config: (() => {
          // Strip non-config keys from the resolved component object
          const { id: _id, componentId: _cid, type: _t, name: _n, order: _o, ...rest } = c;
          return rest;
        })(),
      });
    });
  });

  return {
    pageId: pageRow.id,
    slug: metadata.slug || toKebabCase(pageRow.name),
    zones: zoneInfos,
    components,
  };
};

// Helper: upsert a draft row for pageId with updated metadata JSON string.
const upsertDraft = async (pageRow: any, newMetadataJson: string) => {
  await db.delete(draftPages).where(eq(draftPages.pageId, pageRow.id));
  await db.insert(draftPages).values({
    id: nanoid(),
    pageId: pageRow.id,
    name: pageRow.name,
    description: pageRow.description,
    status: 'draft',
    folderId: pageRow.folderId,
    templateId: pageRow.templateId,
    metadata: newMetadataJson,
    updatedAt: new Date().toISOString(),
  });
};

// Add a new component instance to a page zone.
// Always writes into draft_pages so the published pages row stays intact.
export const addPageInstance = async (ctx: Context) => {
  try {
    const pageId = ctx.req.param('id');
    const { componentId, zoneId, afterIndex } = await ctx.req.json();

    const pageResult = await db.select().from(pages).where(eq(pages.id, pageId));
    const pageRow = pageResult[0];
    if (!pageRow) return ctx.json({ error: 'Page not found' }, 404);

    // Start from existing draft if present, else from published metadata
    const draftResult = await db.select().from(draftPages).where(eq(draftPages.pageId, pageId));
    const existingDraft = draftResult[0];
    const activeRaw = existingDraft?.metadata ?? pageRow.metadata;
    const metadata = activeRaw ? JSON.parse(activeRaw) : {};
    const zones: any[] = metadata.zones || [
      { id: 'body', name: 'Body', type: 'content', componentInstances: [], policy: { maxComponents: null, locked: false } },
    ];

    const instanceId = `instance-${Date.now()}-${nanoid(9)}`;
    const newInstance = { id: instanceId, componentId, config: {}, order: 0 };

    const updatedZones = zones.map((zone: any) => {
      if (zone.id !== zoneId) return zone;
      const instances = [...(zone.componentInstances || [])];
      const insertAt = afterIndex === null || afterIndex === undefined ? instances.length : afterIndex + 1;
      instances.splice(insertAt, 0, newInstance);
      return { ...zone, componentInstances: instances.map((inst: any, idx: number) => ({ ...inst, order: idx })) };
    });

    await upsertDraft(pageRow, JSON.stringify({ ...metadata, zones: updatedZones }));

    const payload = await buildPageModelPayload(pageId);
    return ctx.json(payload, 201);
  } catch (error) {
    console.error('Error adding page instance:', error);
    return ctx.json({ error: 'Failed to add instance' }, 500);
  }
};

// Update component instance content — always writes into draft_pages.
export const updatePageInstance = async (ctx: Context) => {
  try {
    const pageId = ctx.req.param('id');
    const instanceId = ctx.req.param('instanceId');
    const { content } = await ctx.req.json();

    const pageResult = await db.select().from(pages).where(eq(pages.id, pageId));
    const pageRow = pageResult[0];
    if (!pageRow) return ctx.json({ error: 'Page not found' }, 404);

    // Read from existing draft if present, else from published
    const draftResult = await db.select().from(draftPages).where(eq(draftPages.pageId, pageId));
    const existingDraft = draftResult[0];
    const activeRaw = existingDraft?.metadata ?? pageRow.metadata;
    const metadata = activeRaw ? JSON.parse(activeRaw) : {};
    const zones = metadata.zones || [];

    let instanceFound = false;
    const updatedZones = zones.map((zone: any) => ({
      ...zone,
      componentInstances: (zone.componentInstances || []).map((instance: any) => {
        if (instance.id === instanceId) {
          instanceFound = true;
          return { ...instance, config: content };
        }
        return instance;
      }),
    }));

    if (!instanceFound) {
      return ctx.json(
        {
          error: 'Component instance not found.',
          instanceId,
          availableInstances: zones.flatMap((z: any) => (z.componentInstances || []).map((i: any) => i.id || 'no-id')),
        },
        404,
      );
    }

    await upsertDraft(pageRow, JSON.stringify({ ...metadata, zones: updatedZones }));

    return ctx.json({ message: 'Instance updated successfully' });
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
