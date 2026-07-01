import { eq, inArray } from 'drizzle-orm';
import { Context } from 'hono';
import { db } from '../db';
import {
  componentControls,
  components,
  componentSections,
  fieldsetFields,
  fieldsets,
  pages,
  projectSettings,
  templates,
} from '../db/schema';

// Content delivery controller - optimized for remote app consumption
// Returns clean, structured JSON using zone-based architecture

export const getAllPublishedTemplates = async (ctx: Context) => {
  try {
    const allTemplates = await db.select().from(templates);

    const transformedTemplates = allTemplates.map((template) => {
      const metadata = template.metadata ? JSON.parse(template.metadata) : {};
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        layout: metadata.layout || 'header-footer',
        zones: metadata.zones || [],
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    });

    return ctx.json({
      templates: transformedTemplates,
      count: transformedTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching published templates:', error);
    return ctx.json({ error: 'Failed to fetch templates' }, 500);
  }
};

export const getPublishedTemplate = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    const templateResult = await db.select().from(templates).where(eq(templates.id, id));
    if (templateResult.length === 0) {
      return ctx.json({ error: 'Template not found' }, 404);
    }

    const template = templateResult[0];
    if (!template) {
      return ctx.json({ error: 'Template not found' }, 404);
    }

    // Parse zone-based metadata
    const metadata = template.metadata ? JSON.parse(template.metadata) : {};

    // Get component details for zones
    const zones = await Promise.all(
      (metadata.zones || []).map(async (zone: any) => {
        const zoneComponents = await Promise.all(
          (zone.componentInstances || []).map(async (instance: any) => {
            const componentResult = await db.select().from(components).where(eq(components.id, instance.componentId));
            const component = componentResult[0];
            return {
              id: instance.id || `instance-${Date.now()}`,
              type: component?.name || 'unknown',
              componentId: instance.componentId,
              config: instance.config || {},
              order: instance.order || 0,
            };
          }),
        );

        return {
          ...zone,
          componentInstances: zoneComponents,
        };
      }),
    );

    const cleanTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      layout: metadata.layout || 'header-footer',
      zones: zones,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    return ctx.json(cleanTemplate);
  } catch (error) {
    console.error('Error fetching published template:', error);
    return ctx.json({ error: 'Failed to fetch template' }, 500);
  }
};

export const getTemplateStructure = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    const templateResult = await db.select().from(templates).where(eq(templates.id, id));
    if (templateResult.length === 0) {
      return ctx.json({ error: 'Template not found' }, 404);
    }

    const template = templateResult[0];
    if (!template) {
      return ctx.json({ error: 'Template not found' }, 404);
    }

    const metadata = template.metadata ? JSON.parse(template.metadata) : {};
    const structure = {
      id: template.id,
      name: template.name,
      layout: metadata.layout || 'header-footer',
      zones: metadata.zones || [],
    };

    return ctx.json(structure);
  } catch (error) {
    console.error('Error fetching template structure:', error);
    return ctx.json({ error: 'Failed to fetch template structure' }, 500);
  }
};

export const getAllPublishedPages = async (ctx: Context) => {
  try {
    const publishedPages = await db.select().from(pages).where(eq(pages.status, 'published'));

    const transformedPages = publishedPages.map((page) => {
      const metadata = page.metadata ? JSON.parse(page.metadata) : {};
      return {
        id: page.id,
        name: page.name,
        description: page.description,
        slug: metadata.slug || page.id,
        templateId: page.templateId,
        status: page.status,
        publishedAt: page.publishedAt,
        zones: metadata.zones || [],
      };
    });

    return ctx.json({
      pages: transformedPages,
      count: transformedPages.length,
    });
  } catch (error) {
    console.error('Error fetching published pages:', error);
    return ctx.json({ error: 'Failed to fetch pages' }, 500);
  }
};

export const getPublishedPage = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');
    const slug = ctx.req.param('slug');

    // Query by ID or try to find by slug in metadata
    let page;
    if (slug) {
      const allPublishedPages = await db.select().from(pages).where(eq(pages.status, 'published'));
      page = allPublishedPages.find((p) => {
        if (p.metadata) {
          const metadata = JSON.parse(p.metadata);
          return metadata.slug === slug;
        }
        return false;
      });
      if (!page) {
        return ctx.json({ error: 'Page not found' }, 404);
      }
    } else {
      const result = await db.select().from(pages).where(eq(pages.id, id));
      if (result.length === 0 || !result[0] || result[0].status !== 'published') {
        return ctx.json({ error: 'Page not found or not published' }, 404);
      }
      page = result[0];
    }

    if (!page) {
      return ctx.json({ error: 'Page not found' }, 404);
    }

    // Get template structure if page uses one
    let templateStructure = null;
    if (page.templateId) {
      const templateResult = await db.select().from(templates).where(eq(templates.id, page.templateId));
      if (templateResult.length > 0) {
        const template = templateResult[0];
        if (template) {
          const templateMetadata = template.metadata ? JSON.parse(template.metadata) : {};
          templateStructure = {
            id: template.id,
            name: template.name,
            layout: templateMetadata.layout || 'header-footer',
            zones: templateMetadata.zones || [],
          };
        }
      }
    }

    const metadata = page.metadata ? JSON.parse(page.metadata) : {};

    // Get component details for page zones
    const zones = await Promise.all(
      (metadata.zones || []).map(async (zone: any) => {
        const zoneComponents = await Promise.all(
          (zone.componentInstances || []).map(async (instance: any) => {
            const componentResult = await db.select().from(components).where(eq(components.id, instance.componentId));
            const component = componentResult[0];
            return {
              id: instance.id || `instance-${Date.now()}`,
              type: component?.name || 'unknown',
              componentId: instance.componentId,
              config: instance.config || {},
              order: instance.order || 0,
            };
          }),
        );

        return {
          ...zone,
          componentInstances: zoneComponents,
        };
      }),
    );

    const cleanPage = {
      id: page.id,
      name: page.name,
      description: page.description,
      slug: metadata.slug || page.id,
      template: templateStructure,
      zones: zones,
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
    };

    return ctx.json(cleanPage);
  } catch (error) {
    console.error('Error fetching published page:', error);
    return ctx.json({ error: 'Failed to fetch page' }, 500);
  }
};

export const getPageContent = async (ctx: Context) => {
  try {
    const id = ctx.req.param('id');

    const pageResult = await db.select().from(pages).where(eq(pages.id, id));
    if (pageResult.length === 0 || !pageResult[0] || pageResult[0].status !== 'published') {
      return ctx.json({ error: 'Page not found or not published' }, 404);
    }

    const page = pageResult[0];
    const pageMetadata = page.metadata ? JSON.parse(page.metadata) : {};
    let mergedZones: any[] = [];

    // Get template zones if exists
    if (page.templateId) {
      const templateResult = await db.select().from(templates).where(eq(templates.id, page.templateId));
      if (templateResult.length > 0) {
        const template = templateResult[0];
        if (template && template.metadata) {
          const templateMetadata = JSON.parse(template.metadata);
          mergedZones = templateMetadata.zones || [];
        }
      }
    }

    // Merge with page-specific zones (page zones override template zones with same ID)
    const pageZones = pageMetadata.zones || [];
    pageZones.forEach((pageZone: any) => {
      const existingZoneIndex = mergedZones.findIndex((zone) => zone.id === pageZone.id);
      if (existingZoneIndex >= 0) {
        // Override existing zone
        mergedZones[existingZoneIndex] = pageZone;
      } else {
        // Add new zone
        mergedZones.push(pageZone);
      }
    });

    // Get component details for all zones
    const zonesWithComponents = await Promise.all(
      mergedZones.map(async (zone: any) => {
        const zoneComponents = await Promise.all(
          (zone.componentInstances || []).map(async (instance: any) => {
            const componentResult = await db.select().from(components).where(eq(components.id, instance.componentId));
            const component = componentResult[0];
            return {
              id: instance.id || `instance-${Date.now()}`,
              type: component?.name || 'unknown',
              componentId: instance.componentId,
              config: instance.config || {},
              order: instance.order || 0,
            };
          }),
        );

        return {
          ...zone,
          componentInstances: zoneComponents,
        };
      }),
    );

    const content = {
      id: page.id,
      name: page.name,
      slug: pageMetadata.slug || page.id,
      zones: zonesWithComponents,
      publishedAt: page.publishedAt,
    };

    return ctx.json(content);
  } catch (error) {
    console.error('Error fetching page content:', error);
    return ctx.json({ error: 'Failed to fetch page content' }, 500);
  }
};

// Helper function to convert page name to kebab-case
const toKebabCase = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Get page model JSON by kebab-case slug for remote apps.
// Returns a flat components[] array (each entry has zoneId) plus zones[] with policies,
// so the iframe can validate drops and render the correct zone layout.
export const getPageModel = async (ctx: Context) => {
  try {
    const pageName = ctx.req.param('pageName');

    if (!pageName || !pageName.endsWith('.model.json')) {
      return ctx.json({ error: 'Invalid page model request. Use format: page-name.model.json' }, 400);
    }

    const slug = pageName.replace(/\.model\.json$/, '');

    // Accept all pages in preview/edit mode (not just published)
    const allPages = await db.select().from(pages);

    const page = allPages.find((p) => {
      if (p.metadata) {
        const metadata = JSON.parse(p.metadata);
        if (metadata.slug === slug) return true;
      }
      return toKebabCase(p.name) === slug;
    });

    if (!page) {
      const allPublishedPages = allPages.filter((p) => p.status === 'published');
      return ctx.json(
        {
          error: 'Page not found',
          requestedSlug: slug,
          availablePages: allPublishedPages.map((p) => {
            const metadata = p.metadata ? JSON.parse(p.metadata) : {};
            return {
              name: p.name,
              slug: metadata.slug || toKebabCase(p.name),
              endpoint: `/${metadata.slug || toKebabCase(p.name)}.model.json`,
            };
          }),
        },
        404,
      );
    }

    // Read project_name from settings — same as pagesController does to build registry keys
    const settingsRows = await db.select().from(projectSettings);
    const projectName = settingsRows.find((r) => r.key === 'project_name')?.value ?? null;

    const pageMetadata = page.metadata ? JSON.parse(page.metadata) : {};
    let mergedZones: any[] = [];
    // Track which zone IDs originate from the template so they can be marked locked
    const templateZoneIds = new Set<string>();

    // Inherit template zones first
    if (page.templateId) {
      const templateResult = await db.select().from(templates).where(eq(templates.id, page.templateId));
      const template = templateResult[0];
      if (template?.metadata) {
        const templateMetadata = JSON.parse(template.metadata);
        mergedZones = [...(templateMetadata.zones || [])];
        mergedZones.forEach((z: any) => templateZoneIds.add(z.id));
      }
    }

    // Merge page zones on top (page body zone adds/overrides)
    // Page body zone inherits the order slot from zone-body-placeholder so it renders between header and footer
    const placeholder = mergedZones.find((z: any) => z.id === 'zone-body-placeholder');
    const bodySlotOrder: number = placeholder?.order ?? 1;

    const pageZones: any[] = pageMetadata.zones || [];
    for (const pageZone of pageZones) {
      const idx = mergedZones.findIndex((z) => z.id === pageZone.id);
      if (idx >= 0) {
        const templateZone = mergedZones[idx];
        mergedZones[idx] = {
          ...pageZone,
          order: templateZone.order ?? pageZone.order ?? 0,
          componentInstances: [
            ...(templateZone.componentInstances || []),
            ...(pageZone.componentInstances || []),
          ],
        };
      } else {
        // Page-owned zone (e.g. 'body') slots into the body placeholder position
        mergedZones.push({ ...pageZone, order: pageZone.order ?? bodySlotOrder });
      }
    }

    if (mergedZones.length === 0) {
      mergedZones = [{ id: 'body', name: 'Body', type: 'content', order: 0, policy: {}, componentInstances: [] }];
    }

    // Filter out zone-body-placeholder (template-internal sentinel) and sort by order
    const visibleZones = mergedZones
      .filter((z: any) => z.id !== 'zone-body-placeholder')
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const componentsList: any[] = [];
    const zonesInfo: any[] = [];

    for (const zone of visibleZones) {
      const policy = zone.policy || {};
      // Template-owned zones are locked — page editors cannot drop into them
      const locked = templateZoneIds.has(zone.id) || (policy.locked ?? false);
      zonesInfo.push({
        id: zone.id,
        name: zone.name || zone.id,
        type: zone.type || 'content',
        order: zone.order ?? 0,
        maxComponents: policy.maxComponents ?? null,
        locked,
      });

      const instances: any[] = zone.componentInstances || [];
      // Sort by order field
      instances.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

      for (const instance of instances) {
        const componentResult = await db.select().from(components).where(eq(components.id, instance.componentId));
        const component = componentResult[0];
        if (!component) continue;

        // Resolve authored content keyed by section name → { controlLabel: value }
        const config = typeof instance.config === 'string'
          ? JSON.parse(instance.config)
          : instance.config || {};

        const sectionsResult = await db
          .select()
          .from(componentSections)
          .where(eq(componentSections.componentId, component.id));
        const controlsResult = await db
          .select()
          .from(componentControls)
          .where(eq(componentControls.componentId, component.id));
        const sectionIds = sectionsResult.map((s) => s.id);
        const fieldsetsResult = sectionIds.length > 0
          ? await db.select().from(fieldsets).where(inArray(fieldsets.sectionId, sectionIds))
          : [];
        const fieldsetIds = fieldsetsResult.map((f) => f.id);
        const fieldsetFieldsResult = fieldsetIds.length > 0
          ? await db.select().from(fieldsetFields).where(inArray(fieldsetFields.fieldsetId, fieldsetIds))
          : [];

        const toCamelCase = (str: string) =>
          str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_: string, chr: string) => chr.toUpperCase());

        const resolvedContent: Record<string, any> = {};
        for (const section of sectionsResult) {
          const sectionKey = toCamelCase(section.name);
          const sectionObj: Record<string, any> = {};

          for (const control of controlsResult.filter((c) => c.sectionId === section.id)) {
            const val = config[control.id];
            if (val !== undefined) sectionObj[toCamelCase(control.label || control.id)] = val;
          }

          for (const fieldset of fieldsetsResult.filter((f) => f.sectionId === section.id)) {
            const fKey = toCamelCase(fieldset.name);
            const fVal = config[`${section.id}:${fieldset.name}`] ?? config[fieldset.name];
            if (Array.isArray(fVal)) {
              const fFields = fieldsetFieldsResult.filter((ff) => ff.fieldsetId === fieldset.id);
              sectionObj[fKey] = fVal.map((item: any) => {
                const mapped: Record<string, any> = {};
                for (const ff of fFields) {
                  if (item[ff.id] !== undefined) mapped[toCamelCase(ff.label)] = item[ff.id];
                }
                return mapped;
              });
            } else {
              sectionObj[fKey] = [];
            }
          }

          resolvedContent[sectionKey] = sectionObj;
        }

        const componentType = toCamelCase(component.name);
        const type = projectName
          ? `${toKebabCase(projectName)}/components/${componentType}`
          : componentType;

        componentsList.push({
          id: instance.id || `instance-${Date.now()}`,
          componentId: component.id,
          type,
          zoneId: zone.id,
          order: instance.order ?? 0,
          config: resolvedContent,
        });
      }
    }

    const pageModel = {
      meta: {
        id: page.id,
        name: page.name,
        slug: pageMetadata.slug || toKebabCase(page.name),
        status: page.status,
        templateId: page.templateId ?? null,
        generatedAt: new Date().toISOString(),
      },
      zones: zonesInfo,
      components: componentsList,
    };

    ctx.header('Content-Type', 'application/json');
    // No cache in edit mode so authoring changes show immediately
    ctx.header('Cache-Control', 'no-store');

    return ctx.json(pageModel);
  } catch (error) {
    console.error('Error fetching page model:', error);
    return ctx.json({ error: 'Failed to fetch page model' }, 500);
  }
};
