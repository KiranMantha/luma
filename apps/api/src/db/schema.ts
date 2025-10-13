import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Components table
export const components = sqliteTable('components', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['primitive', 'user-defined'] }).notNull(),
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
});

// Teams table (for future use)
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Type exports for TypeScript
export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
export type ComponentControl = typeof componentControls.$inferSelect;
export type NewComponentControl = typeof componentControls.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
