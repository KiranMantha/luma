import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { ComponentType } from '../types/component';

// Components table
export const components = sqliteTable('components', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: [ComponentType.PRIMITIVE, ComponentType.USER_DEFINED] }).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  teamId: text('team_id'), // for future teams feature
  createdBy: text('created_by'), // for user tracking
});

// Component controls/composition
export const componentControls = sqliteTable('component_controls', {
  id: text('id').primaryKey(),
  componentId: text('component_id')
    .notNull()
    .references(() => components.id, { onDelete: 'cascade' }),
  controlType: text('control_type').notNull(),
  label: text('label'),
  config: text('config'), // JSON string for control configuration
  orderIndex: integer('order_index').notNull(),
  sectionId: text('section_id'), // Optional reference to component section
});

// Component sections for organizing controls
export const componentSections = sqliteTable('component_sections', {
  id: text('id').primaryKey(),
  componentId: text('component_id')
    .notNull()
    .references(() => components.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Repeatable structures within component sections
export const repeatableStructures = sqliteTable('repeatable_structures', {
  id: text('id').primaryKey(),
  sectionId: text('section_id')
    .notNull()
    .references(() => componentSections.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at'),
});

// Controls within repeatable structures (fields that define the structure)
export const repeatableStructureFields = sqliteTable('repeatable_structure_fields', {
  id: text('id').primaryKey(),
  structureId: text('structure_id')
    .notNull()
    .references(() => repeatableStructures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // Control type (TEXT, NUMBER, etc.)
  label: text('label').notNull(),
  placeholder: text('placeholder'),
  isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(false),
  config: text('config'), // JSON string for control configuration
  orderIndex: integer('order_index').notNull(),
  createdAt: text('created_at'),
});

// Teams table (for future use)
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Folders for organizing pages
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id'), // Self-reference handled manually in queries
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Templates define reusable page layouts using zone-based architecture
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  metadata: text('metadata'), // JSON: { layout, zones: [{ id, type, componentInstances: [...] }], metadata: {...} }
});

// Pages inherit from templates and can add/modify components using zone-based architecture
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('draft'),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  templateId: text('template_id').references(() => templates.id, { onDelete: 'set null' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  publishedAt: text('published_at'),
  metadata: text('metadata'), // JSON: { zones: [{ id, type, componentInstances: [...] }], slug, seo, tags, etc. }
});

// Type exports for TypeScript
export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
export type ComponentControl = typeof componentControls.$inferSelect;
export type NewComponentControl = typeof componentControls.$inferInsert;
export type ComponentSection = typeof componentSections.$inferSelect;
export type NewComponentSection = typeof componentSections.$inferInsert;
export type RepeatableStructure = typeof repeatableStructures.$inferSelect;
export type NewRepeatableStructure = typeof repeatableStructures.$inferInsert;
export type RepeatableStructureField = typeof repeatableStructureFields.$inferSelect;
export type NewRepeatableStructureField = typeof repeatableStructureFields.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
