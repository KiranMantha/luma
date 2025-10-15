import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import {
  addControlToComponent,
  createComponent,
  deleteComponent,
  deleteControl,
  getAllComponents,
  getComponentById,
  updateComponent,
  updateControl,
} from '../controllers';
import {
  CreateComponentControlSchema,
  CreateComponentSchema,
  UpdateComponentControlSchema,
  UpdateComponentSchema,
} from '../types/component';

const componentsRoute = new Hono();

// Get all components
componentsRoute.get('/', getAllComponents);

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

export { componentsRoute };
