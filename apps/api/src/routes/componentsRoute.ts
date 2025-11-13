import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  addControlToComponent,
  addSectionToComponent,
  createComponent,
  deleteComponent,
  deleteComponentSection,
  deleteControl,
  getAllComponents,
  getAllComponentsForTemplates,
  getComponentById,
  updateComponent,
  updateComponentSection,
  updateControl,
} from '../controllers';
import {
  CreateComponentControlSchema,
  CreateComponentSchema,
  UpdateComponentControlSchema,
  UpdateComponentSchema,
} from '../types/component';

const componentsRoute = new Hono();

// Get all available components (excluding those used in templates)
componentsRoute.get('/', getAllComponents);

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

export { componentsRoute };
