import { z } from 'zod';

export enum ComponentType {
  PRIMITIVE = 'primitive',
  USER_DEFINED = 'user-defined',
}

// Validation schemas
export const CreateComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(ComponentType),
});

export const UpdateComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required').optional(),
  description: z.string().optional(),
});

export const CreateComponentControlSchema = z.object({
  controlType: z.string().min(1, 'Control type is required'),
  label: z.string().optional(),
  config: z.record(z.string(), z.any()), // JSON object
  orderIndex: z.number().int().min(0),
  sectionId: z.string().optional(), // Optional section assignment
});

export const UpdateComponentControlSchema = z.object({
  controlType: z.string().min(1, 'Control type is required').optional(),
  label: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const CreateFieldsetSchema = z.object({
  name: z.string().min(1, 'Fieldset name is required'),
  description: z.string().nullable().optional(),
  controls: z
    .array(
      z.object({
        name: z.string().min(1, 'Control name is required'),
        type: z.string().min(1, 'Control type is required'),
        label: z.string(),
        placeholder: z.string().optional(),
        isRequired: z.boolean().optional(),
        config: z.record(z.string(), z.any()).optional(),
      }),
    )
    .optional()
    .default([]),
});

// Response types
export const ComponentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.nativeEnum(ComponentType),
  createdAt: z.string(),
  updatedAt: z.string(),
  teamId: z.string().nullable(),
  createdBy: z.string().nullable(),
  controls: z
    .array(
      z.object({
        id: z.string(),
        controlType: z.string(),
        label: z.string().nullable(),
        config: z.record(z.string(), z.any()),
        orderIndex: z.number(),
      }),
    )
    .optional(),
});

// Type exports
export type CreateComponentRequest = z.infer<typeof CreateComponentSchema>;
export type UpdateComponentRequest = z.infer<typeof UpdateComponentSchema>;
export type CreateComponentControlRequest = z.infer<typeof CreateComponentControlSchema>;
export type UpdateComponentControlRequest = z.infer<typeof UpdateComponentControlSchema>;
export type CreateFieldsetRequest = z.infer<typeof CreateFieldsetSchema>;
export type ComponentResponse = z.infer<typeof ComponentResponseSchema>;
