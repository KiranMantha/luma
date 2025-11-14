import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { db } from '../db';
import { components, pages, templates } from '../db/schema';

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
