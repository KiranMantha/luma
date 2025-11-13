import { Hono } from 'hono';
import {
  getAllPublishedPages,
  getAllPublishedTemplates,
  getPageContent,
  getPublishedPage,
  getPublishedTemplate,
  getTemplateStructure,
} from '../controllers/contentController';

const contentRoute = new Hono();

// Content delivery endpoints for remote apps
// These endpoints return clean, consumption-ready JSON

// Get all published templates (for remote app discovery)
contentRoute.get('/templates', getAllPublishedTemplates);

// Get specific template structure for remote app
contentRoute.get('/templates/:id', getPublishedTemplate);

// Get template structure only (zones, layout, metadata)
contentRoute.get('/templates/:id/structure', getTemplateStructure);

// Get all published pages
contentRoute.get('/pages', getAllPublishedPages);

// Get specific page content for remote app
contentRoute.get('/pages/:id', getPublishedPage);

// Get page content with resolved template structure
contentRoute.get('/pages/:id/content', getPageContent);

// Get page by slug (for SEO-friendly URLs)
contentRoute.get('/pages/by-slug/:slug', getPublishedPage);

export { contentRoute };
