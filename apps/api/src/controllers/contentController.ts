import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { db } from '../db';
import { componentInstances, components, pages, templates } from '../db/schema';

// Content delivery controller - optimized for remote app consumption
// Returns clean, structured JSON without internal CMS metadata

export const getAllPublishedTemplates = async (ctx: Context) => {
  try {
    const allTemplates = await db.select().from(templates);

    const transformedTemplates = allTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      metadata: template.metadata ? JSON.parse(template.metadata) : {},
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

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

    // Get component instances with component details
    const instances = await db
      .select({
        id: componentInstances.id,
        componentId: componentInstances.componentId,
        position: componentInstances.position,
        size: componentInstances.size,
        config: componentInstances.config,
        orderIndex: componentInstances.orderIndex,
        componentName: components.name,
        componentType: components.type,
      })
      .from(componentInstances)
      .leftJoin(components, eq(componentInstances.componentId, components.id))
      .where(eq(componentInstances.templateId, id));

    // Transform the template for remote consumption
    const cleanTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      layout: 'full-width', // Default until we add layout field to schema
      metadata: template.metadata ? JSON.parse(template.metadata) : {},
      components: instances.map((instance) => ({
        id: instance.id,
        type: instance.componentName || 'unknown',
        componentId: instance.componentId,
        position: instance.position ? JSON.parse(instance.position) : { x: 0, y: 0 },
        size: instance.size ? JSON.parse(instance.size) : { width: 200, height: 100 },
        config: instance.config ? JSON.parse(instance.config) : {},
        order: instance.orderIndex || 0,
      })),
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

    const structure = {
      id: template.id,
      name: template.name,
      layout: 'full-width', // Default until we add layout field
      metadata: template.metadata ? JSON.parse(template.metadata) : {},
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
        metadata: metadata,
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
          templateStructure = {
            id: template.id,
            name: template.name,
            layout: 'full-width',
          };
        }
      }
    }

    // Get page component instances
    const instances = await db
      .select({
        id: componentInstances.id,
        componentId: componentInstances.componentId,
        position: componentInstances.position,
        size: componentInstances.size,
        config: componentInstances.config,
        orderIndex: componentInstances.orderIndex,
        componentName: components.name,
        componentType: components.type,
      })
      .from(componentInstances)
      .leftJoin(components, eq(componentInstances.componentId, components.id))
      .where(eq(componentInstances.pageId, page.id));

    const metadata = page.metadata ? JSON.parse(page.metadata) : {};
    const cleanPage = {
      id: page.id,
      name: page.name,
      description: page.description,
      slug: metadata.slug || page.id,
      template: templateStructure,
      metadata: metadata,
      components: instances.map((instance) => ({
        id: instance.id,
        type: instance.componentName || 'unknown',
        componentId: instance.componentId,
        position: instance.position ? JSON.parse(instance.position) : { x: 0, y: 0 },
        size: instance.size ? JSON.parse(instance.size) : { width: 200, height: 100 },
        config: instance.config ? JSON.parse(instance.config) : {},
        order: instance.orderIndex || 0,
      })),
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
    let mergedComponents: any[] = [];

    // Get template components if exists
    if (page.templateId) {
      const templateInstances = await db
        .select({
          id: componentInstances.id,
          componentId: componentInstances.componentId,
          config: componentInstances.config,
          orderIndex: componentInstances.orderIndex,
          componentName: components.name,
        })
        .from(componentInstances)
        .leftJoin(components, eq(componentInstances.componentId, components.id))
        .where(eq(componentInstances.templateId, page.templateId));

      mergedComponents.push(
        ...templateInstances.map((instance) => ({
          id: instance.id,
          type: instance.componentName || 'unknown',
          config: instance.config ? JSON.parse(instance.config) : {},
          order: instance.orderIndex || 0,
          source: 'template',
        })),
      );
    }

    // Get page-specific components
    const pageInstances = await db
      .select({
        id: componentInstances.id,
        componentId: componentInstances.componentId,
        config: componentInstances.config,
        orderIndex: componentInstances.orderIndex,
        componentName: components.name,
      })
      .from(componentInstances)
      .leftJoin(components, eq(componentInstances.componentId, components.id))
      .where(eq(componentInstances.pageId, page.id));

    mergedComponents.push(
      ...pageInstances.map((instance) => ({
        id: instance.id,
        type: instance.componentName || 'unknown',
        config: instance.config ? JSON.parse(instance.config) : {},
        order: instance.orderIndex || 0,
        source: 'page',
      })),
    );

    const metadata = page.metadata ? JSON.parse(page.metadata) : {};
    const content = {
      id: page.id,
      name: page.name,
      slug: metadata.slug || page.id,
      metadata: metadata,
      content: mergedComponents,
      publishedAt: page.publishedAt,
    };

    return ctx.json(content);
  } catch (error) {
    console.error('Error fetching page content:', error);
    return ctx.json({ error: 'Failed to fetch page content' }, 500);
  }
};
