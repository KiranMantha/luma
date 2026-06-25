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

// Get page model JSON by kebab-case name for remote apps
export const getPageModel = async (ctx: Context) => {
  try {
    const pageName = ctx.req.param('pageName');

    if (!pageName || !pageName.endsWith('.model.json')) {
      return ctx.json({ error: 'Invalid page model request. Use format: page-name.model.json' }, 400);
    }

    // Remove .model.json extension to get the page name
    const pageNameWithoutExt = pageName.replace(/\.model.json$/, '');

    // Find published page by matching kebab-case name
    const allPublishedPages = await db.select().from(pages).where(eq(pages.status, 'published'));

    const page = allPublishedPages.find((p) => p.slug === pageNameWithoutExt);

    if (!page) {
      return ctx.json(
        {
          error: 'Page not found or not published',
          requestedPageName: pageNameWithoutExt,
          availablePages: allPublishedPages.map((p) => {
            const metadata = p.metadata ? JSON.parse(p.metadata) : {};
            return {
              name: p.name,
              kebabName: toKebabCase(p.name),
              slug: metadata.slug,
              endpoint: `/${metadata.slug || toKebabCase(p.name)}.model.json`,
            };
          }),
        },
        404,
      );
    }

    // Parse page metadata
    const pageMetadata = page.metadata ? JSON.parse(page.metadata) : {};
    let mergedZones: any[] = [];

    // Get template zones if page uses a template
    if (page.templateId) {
      const templateResult = await db.select().from(templates).where(eq(templates.id, page.templateId));
      if (templateResult.length > 0) {
        const template = templateResult[0];
        if (template && template.metadata) {
          const templateMetadata = JSON.parse(template.metadata);
          mergedZones = [...(templateMetadata.zones || [])];
        }
      }
    }

    // Merge page zones with template zones (merge component instances)
    const pageZones = pageMetadata.zones || [];
    pageZones.forEach((pageZone: any) => {
      const existingZoneIndex = mergedZones.findIndex((z) => z.id === pageZone.id);
      if (existingZoneIndex >= 0) {
        // Merge template zone components with page zone components
        const templateZone = mergedZones[existingZoneIndex];
        mergedZones[existingZoneIndex] = {
          ...pageZone,
          componentInstances: [...(templateZone.componentInstances || []), ...(pageZone.componentInstances || [])],
        };
      } else {
        // Add new page zone
        mergedZones.push(pageZone);
      }
    });

    // If no zones exist, add default body zone
    if (mergedZones.length === 0) {
      mergedZones = [
        {
          id: 'body',
          name: 'Body',
          type: 'content',
          componentInstances: [],
        },
      ];
    }

    // Resolve component details for each zone and flatten into content object
    const content: Record<string, any> = {};
    const componentNameCount: Record<string, number> = {};
    const componentsOrder: string[] = [];

    // Helper to convert string to camelCase
    const toCamelCase = (str: string): string => {
      return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
    };

    for (const zone of mergedZones) {
      for (const instance of zone.componentInstances || []) {
        const componentResult = await db.select().from(components).where(eq(components.id, instance.componentId));
        const component = componentResult[0];

        if (component) {
          // Get component sections, controls, and fieldsets (structure from component definition)
          const sectionsResult = await db
            .select()
            .from(componentSections)
            .where(eq(componentSections.componentId, component.id));
          const controlsResult = await db
            .select()
            .from(componentControls)
            .where(eq(componentControls.componentId, component.id));

          const sectionIds = sectionsResult.map((s) => s.id);
          const fieldsetsResult = sectionIds.length > 0 ? await db.select().from(fieldsets).where(inArray(fieldsets.sectionId, sectionIds)) : [];
          const fieldsetIds = fieldsetsResult.map((f) => f.id);
          const fieldsetFieldsResult = fieldsetIds.length > 0 ? await db.select().from(fieldsetFields).where(inArray(fieldsetFields.fieldsetId, fieldsetIds)) : [];

          const componentContent: any = {};
          // Parse instance config (contains actual values with control IDs as keys)
          const config = typeof instance.config === 'string' ? JSON.parse(instance.config) : instance.config || {};

          console.log('Instance config for', component.name, ':', JSON.stringify(config, null, 2));

          // Build sections as objects
          for (const section of sectionsResult) {
            const sectionKey = toCamelCase(section.name);
            const sectionObject: any = {};

            // Get controls for this section and map their values
            const sectionControls = controlsResult.filter((control) => control.sectionId === section.id);

            for (const control of sectionControls) {
              const controlValue = config[control.id];
              if (controlValue !== undefined) {
                // Use camelCased control label as key
                const controlKey = toCamelCase(control.label || control.id);
                sectionObject[controlKey] = controlValue;
              }
            }

            // Get fieldsets for this section and map their values
            const sectionFieldsets = fieldsetsResult.filter((fieldset) => fieldset.sectionId === section.id);

            for (const fieldset of sectionFieldsets) {
              const fieldsetKey = toCamelCase(fieldset.name);
              const fieldsetValue = config[fieldset.name];

              if (fieldsetValue !== undefined) {
                // Fieldsets are arrays of objects with fieldset field IDs as keys
                if (Array.isArray(fieldsetValue)) {
                  // Map field IDs to camelCased field labels for each item in the array
                  const fieldsetFields = fieldsetFieldsResult.filter((field) => field.fieldsetId === fieldset.id);

                  sectionObject[fieldsetKey] = fieldsetValue.map((item: any) => {
                    const mappedItem: any = {};
                    for (const field of fieldsetFields) {
                      if (item[field.id] !== undefined) {
                        const fieldKey = toCamelCase(field.label);
                        mappedItem[fieldKey] = item[field.id];
                      }
                    }
                    return mappedItem;
                  });
                } else {
                  sectionObject[fieldsetKey] = [];
                }
              } else {
                sectionObject[fieldsetKey] = [];
              }
            }

            componentContent[sectionKey] = sectionObject;
          }

          // Generate unique component key
          const camelComponentName = toCamelCase(component.name);
          let componentKey = camelComponentName;

          if (componentNameCount[camelComponentName]) {
            componentNameCount[camelComponentName]++;
            const randomSuffix = `_${Math.random().toString(36).substr(2, 6)}`;
            componentKey = `${camelComponentName}${randomSuffix}`;
          } else {
            componentNameCount[camelComponentName] = 1;
          }

          content[componentKey] = componentContent;
          componentsOrder.push(componentKey);
        }
      }
    }

    // Build complete page model
    const pageModel = {
      meta: {
        id: page.id,
        name: page.name,
        description: page.description,
        slug: pageMetadata.slug || toKebabCase(page.name),
        status: page.status,
        publishedAt: page.publishedAt,
        updatedAt: page.updatedAt,
        templateId: page.templateId,
        apiEndpoint: `/${pageMetadata.slug || toKebabCase(page.name)}.model.json`,
        generatedAt: new Date().toISOString(),
      },
      seo: {
        title: pageMetadata.seoTitle || page.name,
        description: pageMetadata.seoDescription || page.description,
        tags: pageMetadata.tags || [],
      },
      componentsOrder,
      content,
      // Include metadata for remote app consumption
      metadata: pageMetadata.metadata || {},
    };

    // Set appropriate headers for JSON model
    ctx.header('Content-Type', 'application/json');
    ctx.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return ctx.json(pageModel);
  } catch (error) {
    console.error('Error fetching page model:', error);
    return ctx.json({ error: 'Failed to fetch page model' }, 500);
  }
};
