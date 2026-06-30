import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { componentsRoute, contentRoute, pagesRoute, settingsRoute, templatesRoute } from './routes';
import { errorResponse, successResponse } from './types/response';

const app = new Hono();

// Centralized error handler
app.onError((err, ctx) => {
  console.error('Error:', err);

  // Handle HTTPException (thrown manually)
  if (err instanceof HTTPException) {
    return errorResponse(ctx, err.message, err.status as any);
  }

  // Handle unexpected errors
  return errorResponse(ctx, 'Internal Server Error', 500);
});

console.log('\ncors origins:', process.env.CORS_ORIGINS, '\n');

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((s) => s.trim());

app.use('*', cors({ origin: allowedOrigins, credentials: true }));
app.use('*', logger());
app.use('*', prettyJSON());

// Health check
app.get('/', (c) => {
  return successResponse(c, {
    message: 'Luma CMS API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route('/api/components', componentsRoute);
app.route('/api/templates', templatesRoute);
app.route('/api/pages', pagesRoute);

// Content delivery routes for remote apps
app.route('/api/content', contentRoute);

// Project settings (preview URL, etc.)
app.route('/api/settings', settingsRoute);

// Direct page model access (e.g., /page/about-us.model.json)
// app.get('/api/page/:filename', async (c) => {
//   const { servePageJSON } = await import('./controllers/pagesController');
//   return servePageJSON(c);
// });

// 404 handler
app.notFound((c) => {
  return errorResponse(c, 'Not Found', 404);
});

const port = Number(process.env.PORT || '3002');

const server = serve({
  fetch: app.fetch,
  port,
});

// graceful shutdown
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});

console.log(`🚀 Luma CMS API starting on port ${port}`);
console.log(`📊 Health check: http://localhost:${port}`);
console.log(`🧱 Components API: http://localhost:${port}/api/components`);
