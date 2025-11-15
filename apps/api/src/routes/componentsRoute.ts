import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  addControlToComponent,
  addFieldsetToSection,
  addSectionToComponent,
  createComponent,
  deleteComponent,
  deleteComponentSection,
  deleteControl,
  deleteFieldset,
  getAllComponents,
  getAllComponentsForTemplates,
  getAvailableComponentsForPages,
  getComponentById,
  updateComponent,
  updateComponentSection,
  updateControl,
  updateFieldset,
} from '../controllers';
import {
  CreateComponentControlSchema,
  CreateComponentSchema,
  CreateFieldsetSchema,
  UpdateComponentControlSchema,
  UpdateComponentSchema,
} from '../types/component';

const componentsRoute = new Hono();

// Get all components (for component builder - shows everything)
componentsRoute.get('/', getAllComponents);

// Get available components for pages (excluding those used in templates)
componentsRoute.get('/available-for-pages', getAvailableComponentsForPages);

// Get all components including those used in templates (for template builder)
componentsRoute.get('/all-for-templates', getAllComponentsForTemplates);

// Get component by ID
componentsRoute.get('/:id', getComponentById);

// Create component
componentsRoute.post('/', zValidator('json', CreateComponentSchema), createComponent);

// Update component
componentsRoute.put('/:id', zValidator('json', UpdateComponentSchema), updateComponent);

// Delete component
componentsRoute.delete('/:id', deleteComponent);

// Add control to component
componentsRoute.post('/:id/controls', zValidator('json', CreateComponentControlSchema), addControlToComponent);

// Update control
componentsRoute.put('/:id/controls/:controlId', zValidator('json', UpdateComponentControlSchema), updateControl);

// Delete control
componentsRoute.delete('/:id/controls/:controlId', deleteControl);

// Add section to component
componentsRoute.post('/:id/sections', addSectionToComponent);

// Update section
componentsRoute.put('/:id/sections/:sectionId', updateComponentSection);

// Delete section
componentsRoute.delete('/:id/sections/:sectionId', deleteComponentSection);

// Add fieldset to section
componentsRoute.post(
  '/:id/sections/:sectionId/fieldsets',
  zValidator('json', CreateFieldsetSchema),
  addFieldsetToSection,
);

// Update fieldset
componentsRoute.put(
  '/:id/sections/:sectionId/fieldsets/:fieldsetId',
  zValidator('json', CreateFieldsetSchema),
  updateFieldset,
);

// Delete fieldset
componentsRoute.delete('/:id/sections/:sectionId/fieldsets/:fieldsetId', deleteFieldset);

export { componentsRoute };
