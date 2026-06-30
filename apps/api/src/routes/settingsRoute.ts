import { Hono } from 'hono';
import { getSettings, updateSettings } from '../controllers';

const settingsRoute = new Hono();

settingsRoute.get('/', getSettings);
settingsRoute.put('/', updateSettings);

export { settingsRoute };
