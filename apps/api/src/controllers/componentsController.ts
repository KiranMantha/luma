import { desc, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { componentControls, components } from '../db/schema';
import type {
  CreateComponentControlRequest,
  CreateComponentRequest,
  UpdateComponentControlRequest,
  UpdateComponentRequest,
} from '../types/component';
import { successResponse } from '../types/response';

export const getAllComponents = async (ctx: Context) => {
  const allComponents = await db.select().from(components).orderBy(desc(components.createdAt));

  const componentsWithControls = await Promise.all(
    allComponents.map(async (component) => {
      const controls = await db
        .select()
        .from(componentControls)
        .where(eq(componentControls.componentId, component.id))
        .orderBy(componentControls.orderIndex);

      return {
        ...component,
        controls: controls.map((control) => ({
          ...control,
          config: control.config ? JSON.parse(control.config) : {},
        })),
      };
    }),
  );

  return successResponse(ctx, componentsWithControls);
};

export const getComponentById = async (ctx: Context) => {
  const id = ctx.req.param('id');
  const component = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!component) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  const controls = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.componentId, id))
    .orderBy(componentControls.orderIndex);

  const componentWithControls = {
    ...component,
    controls: controls.map((control) => ({
      ...control,
      config: control.config ? JSON.parse(control.config) : {},
    })),
  };

  return successResponse(ctx, componentWithControls);
};

export const createComponent = async (ctx: Context) => {
  const data: CreateComponentRequest = await ctx.req.json();
  const id = nanoid();

  await db.insert(components).values({
    id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const newComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);
  const componentWithControls = { ...newComponent, controls: [] };
  return successResponse(ctx, componentWithControls, 201);
};

export const updateComponent = async (ctx: Context) => {
  const id = ctx.req.param('id');
  const data: UpdateComponentRequest = await ctx.req.json();
  const existingComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingComponent) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  await db
    .update(components)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(components.id, id));

  const updatedComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  const controls = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.componentId, id))
    .orderBy(componentControls.orderIndex);

  const componentWithControls = {
    ...updatedComponent,
    controls: controls.map((control) => ({
      ...control,
      config: control.config ? JSON.parse(control.config) : {},
    })),
  };

  return successResponse(ctx, componentWithControls);
};

export const deleteComponent = async (ctx: Context) => {
  const id = ctx.req.param('id');
  const existingComponent = await db
    .select()
    .from(components)
    .where(eq(components.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingComponent) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  await db.delete(components).where(eq(components.id, id));
  return successResponse(ctx, { message: 'Component deleted successfully' }, 200);
};

export const addControlToComponent = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const data: CreateComponentControlRequest = await ctx.req.json();
  const component = await db
    .select()
    .from(components)
    .where(eq(components.id, componentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!component) {
    throw new HTTPException(404, { message: 'Component not found' });
  }

  const controlId = nanoid();

  await db.insert(componentControls).values({
    id: controlId,
    componentId,
    ...data,
    config: JSON.stringify(data.config),
  });

  const newControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  const controlData = {
    ...newControl,
    config: newControl?.config ? JSON.parse(newControl.config) : {},
  };

  return successResponse(ctx, controlData, 201);
};

export const updateControl = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const controlId = ctx.req.param('controlId');
  const data: UpdateComponentControlRequest = await ctx.req.json();
  const existingControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingControl || existingControl.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Control not found' });
  }

  const updateData: any = { ...data };
  if (data.config) {
    updateData.config = JSON.stringify(data.config);
  }

  await db.update(componentControls).set(updateData).where(eq(componentControls.id, controlId));

  const updatedControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  const controlData = {
    ...updatedControl,
    config: updatedControl?.config ? JSON.parse(updatedControl.config) : {},
  };

  return successResponse(ctx, controlData, 200);
};

export const deleteControl = async (ctx: Context) => {
  const componentId = ctx.req.param('id');
  const controlId = ctx.req.param('controlId');
  const existingControl = await db
    .select()
    .from(componentControls)
    .where(eq(componentControls.id, controlId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingControl || existingControl.componentId !== componentId) {
    throw new HTTPException(404, { message: 'Control not found' });
  }

  await db.delete(componentControls).where(eq(componentControls.id, controlId));
  return successResponse(ctx, { message: 'Control deleted successfully' }, 200);
};
