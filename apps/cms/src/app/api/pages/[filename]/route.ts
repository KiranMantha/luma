import * as fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import { getCachedPreviewUrl, setCachedPreviewUrl } from '@/lib/settingsCache';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

async function getAllowedOrigin(): Promise<string | null> {
  const cached = getCachedPreviewUrl();
  if (cached !== undefined) {
    return cached ? new URL(cached).origin : null;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings`, { cache: 'no-store' });
    if (!res.ok) { setCachedPreviewUrl(null); return null; }
    const { previewUrl } = await res.json();
    setCachedPreviewUrl(previewUrl ?? null);
    return previewUrl ? new URL(previewUrl).origin : null;
  } catch {
    setCachedPreviewUrl(null);
    return null;
  }
}

function corsHeaders(origin: string | null, requestOrigin: string | null): Record<string, string> {
  if (!origin || !requestOrigin || requestOrigin !== origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(req: NextRequest) {
  const allowedOrigin = await getAllowedOrigin();
  const requestOrigin = req.headers.get('origin');
  const headers = corsHeaders(allowedOrigin, requestOrigin);

  if (!headers['Access-Control-Allow-Origin']) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, { status: 204, headers });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!filename.endsWith('.model.json')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const allowedOrigin = await getAllowedOrigin();
  const requestOrigin = req.headers.get('origin');
  const cors = corsHeaders(allowedOrigin, requestOrigin);

  // Block cross-origin requests from non-configured origins
  if (requestOrigin && !cors['Access-Control-Allow-Origin']) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const slug = filename.replace(/\.model\.json$/, '');

  // 1. Try static file first (written by API on every save)
  const filePath = path.join(process.cwd(), 'public', 'pages', filename);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(raw), {
      headers: { ...cors, 'Cache-Control': 'public, max-age=0, must-revalidate' },
    });
  } catch {
    // File not yet generated — fall through to live API
  }

  // 2. Fallback: proxy to backend content API (returns { meta, zones, components })
  const res = await fetch(`${API_BASE_URL}/api/content/page/${slug}.model.json`, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: 'Page not found' }, { status: res.status, headers: cors });
  }

  return NextResponse.json(await res.json(), {
    headers: { ...cors, 'Cache-Control': 'no-store' },
  });
}
