import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { db } from '../db';
import { projectSettings } from '../db/schema';

const PREVIEW_URL_KEY = 'preview_url';
const PROJECT_NAME_KEY = 'project_name';

export const getSettings = async (ctx: Context) => {
  try {
    const rows = await db.select().from(projectSettings);
    const find = (key: string) => rows.find((r) => r.key === key)?.value || null;
    return ctx.json({ previewUrl: find(PREVIEW_URL_KEY), projectName: find(PROJECT_NAME_KEY) });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return ctx.json({ error: 'Failed to fetch settings' }, 500);
  }
};

export const updateSettings = async (ctx: Context) => {
  try {
    const { previewUrl, projectName } = await ctx.req.json();

    const upsert = (key: string, value: string) =>
      db
        .insert(projectSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: projectSettings.key, set: { value, updatedAt: new Date().toISOString() } });

    if (typeof previewUrl === 'string') await upsert(PREVIEW_URL_KEY, previewUrl);
    if (typeof projectName === 'string') await upsert(PROJECT_NAME_KEY, projectName);

    return ctx.json({ previewUrl: previewUrl ?? null, projectName: projectName ?? null });
  } catch (error) {
    console.error('Error updating settings:', error);
    return ctx.json({ error: 'Failed to update settings' }, 500);
  }
};
