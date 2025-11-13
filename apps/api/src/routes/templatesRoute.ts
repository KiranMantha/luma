import { Hono } from 'hono';
import { createTemplate, deleteTemplate, getAllTemplates, getTemplateById, updateTemplate } from '../controllers';

const templatesRoute = new Hono();

// Get all templates
templatesRoute.get('/', getAllTemplates);

// Get template by ID
templatesRoute.get('/:id', getTemplateById);

// Create template
templatesRoute.post('/', createTemplate);

// Update template
templatesRoute.put('/:id', updateTemplate);

// Delete template
templatesRoute.delete('/:id', deleteTemplate);

export { templatesRoute };
