// ─── Luma Core — framework-agnostic ──────────────────────────────────────────
//
// All postMessage bridging, drag state, zone logic, and CSS constants live here.
// Import this from any framework adapter (React, Vue, Angular, Svelte, etc.).
// Zero framework dependencies — plain TypeScript only.

// ── Types ─────────────────────────────────────────────────────────────────────

export type ZoneInfo = {
  id: string;
  name: string;
  type: string;
  order: number;
  maxComponents: number | null;
  locked: boolean;
};

export type ComponentData = {
  id: string;
  componentId: string;
  type: string;
  zoneId: string;
  order: number;
  config: Record<string, unknown>; // edit mode: resolved section data keyed by section name
  [key: string]: unknown;          // preview mode: section data spread at top level
};

export type PageModel = {
  id: string;
  name: string;
  slug: string;
  status: string;
  components: ComponentData[];
};

export type PageModelPayload = {
  pageId: string;
  slug: string;
  zones: ZoneInfo[];
  components: ComponentData[];
};

export type ComponentPayload = {
  instanceId: string;
  componentId: string;
  type: string;
  zoneId: string;
  order: number;
  config: Record<string, unknown>;
};

type InboundMsg =
  | { source: 'luma-cms'; version: 1; type: 'pageModel'; payload: PageModelPayload }
  | { source: 'luma-cms'; version: 1; type: 'component'; payload: ComponentPayload };

type OutboundMsg =
  | { source: 'luma-preview'; type: 'ready' }
  | { source: 'luma-preview'; type: 'instance-click'; instanceId: string; componentId: string }
  | { source: 'luma-preview'; type: 'instance-reorder'; fromIndex: number; toIndex: number; zoneId: string }
  | { source: 'luma-preview'; type: 'add-component'; zoneId: string; afterIndex: number | null };

export type DragState = {
  instanceId: string;
  index: number;
  zoneId: string;
} | null;

// ── Mode ──────────────────────────────────────────────────────────────────────
// Read once at module load — URL never changes while the app is running.

export const MODE: 'edit' | 'preview' =
  new URLSearchParams(window.location.search).get('mode') === 'edit' ? 'edit' : 'preview';

// ── postMessage → CMS ─────────────────────────────────────────────────────────

export function postMessageToCMS(msg: OutboundMsg): void {
  window.parent?.postMessage(msg, '*');
}

// ── postMessage bridge → window CustomEvents ──────────────────────────────────
//
// Single entry point for all messages from the CMS.
// Re-dispatches as typed window CustomEvents that framework adapters subscribe to:
//   'luma:pageModel'              — PageModelPayload  → full page repaint
//   'luma:component:<instanceId>' — ComponentPayload  → single component update

export function initPostMessageBridge(): () => void {
  const handler = (event: MessageEvent) => {
    const msg = event.data as InboundMsg;
    if (msg?.source !== 'luma-cms') return;

    if (msg.type === 'pageModel') {
      window.dispatchEvent(new CustomEvent('luma:pageModel', { detail: msg.payload }));
    }

    if (msg.type === 'component') {
      window.dispatchEvent(
        new CustomEvent(`luma:component:${msg.payload.instanceId}`, { detail: msg.payload }),
      );
    }
  };

  window.addEventListener('message', handler);
  postMessageToCMS({ source: 'luma-preview', type: 'ready' });
  return () => window.removeEventListener('message', handler);
}

// ── Drag state ────────────────────────────────────────────────────────────────
// Module-level singleton so all wrappers share one drag session.

let _currentDrag: DragState = null;
const _dragListeners = new Set<(dragging: boolean) => void>();

export function getCurrentDrag(): DragState {
  return _currentDrag;
}

export function setCurrentDrag(val: DragState): void {
  _currentDrag = val;
  _dragListeners.forEach((fn) => fn(val !== null));
}

export function onDragChange(fn: (dragging: boolean) => void): void {
  _dragListeners.add(fn);
}

export function offDragChange(fn: (dragging: boolean) => void): void {
  _dragListeners.delete(fn);
}

// ── Drag logic ────────────────────────────────────────────────────────────────

export function startInstanceDrag(
  instanceId: string,
  index: number,
  zoneId: string,
  dataTransfer: DataTransfer,
): void {
  setCurrentDrag({ instanceId, index, zoneId });
  dataTransfer.effectAllowed = 'move';
}

export function endInstanceDrag(): void {
  if (_currentDrag) setCurrentDrag(null);
}

export function canZoneAccept(maxComponents: number | null, componentCount: number): boolean {
  if (maxComponents !== null && componentCount >= maxComponents) return false;
  return true;
}

export function handleDropOnBar(
  afterIndex: number | null,
  zoneId: string,
  maxComponents: number | null,
  componentCount: number,
): void {
  const drag = _currentDrag;
  if (!drag || !canZoneAccept(maxComponents, componentCount)) return;

  const toIndex = afterIndex === null ? 0 : afterIndex + 1;
  if (drag.index !== toIndex) {
    postMessageToCMS({
      source: 'luma-preview',
      type: 'instance-reorder',
      fromIndex: drag.index,
      toIndex,
      zoneId,
    });
  }
  setCurrentDrag(null);
}

// ── CMS notification helpers ──────────────────────────────────────────────────

export function notifyInstanceClick(instanceId: string, componentId: string): void {
  postMessageToCMS({ source: 'luma-preview', type: 'instance-click', instanceId, componentId });
}

export function notifyAddComponent(zoneId: string, afterIndex: number | null): void {
  postMessageToCMS({ source: 'luma-preview', type: 'add-component', zoneId, afterIndex });
}

// ── Page data fetching ────────────────────────────────────────────────────────

const CMS_BASE_URL = (import.meta as any).env?.VITE_CMS_BASE_URL ?? '';

export async function fetchPageBySlug(slug: string): Promise<PageModel> {
  const res = await fetch(`${CMS_BASE_URL}/pages/${slug}.model.json`);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);
  return res.json();
}

export function getPageSlugFromUrl(): string | null {
  return window.location.pathname.split('/').filter(Boolean).at(-1) ?? null;
}

// ── Data helpers ─────────────────────────────────────────────────────────────

export function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getZoneComponents(components: ComponentData[], zoneId: string): ComponentData[] {
  return sortByOrder(components.filter((c) => c.zoneId === zoneId));
}

// Whether a component instance has any authored content.
export function hasContent(config: Record<string, unknown> | undefined): boolean {
  return Object.keys(config ?? {}).length > 0;
}

// Strip the known meta keys from a flat preview-mode component object,
// returning only the section data to spread as props.
const META_KEYS = new Set(['id', 'componentId', 'type', 'name', 'order', 'zoneId', 'config']);

export function extractSectionData(comp: ComponentData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(comp)) {
    if (!META_KEYS.has(key)) result[key] = comp[key];
  }
  return result;
}

// ── CSS constants (plain objects — usable by any framework) ───────────────────

export const CSS = {
  overlay: {
    position: 'absolute',
    inset: 0,
    border: '2px solid transparent',
    boxSizing: 'border-box',
    cursor: 'grab',
    transition: 'border-color 0.12s, background 0.12s',
    zIndex: 10,
  },
  overlayHover: {
    borderColor: '#6366f1',
    background: 'rgba(99,102,241,0.04)',
  },
  editBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    background: '#6366f1',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: 11,
    letterSpacing: '0.04em',
  },
  dropBar: {
    height: 6,
    borderRadius: 3,
    margin: '0 12px',
    background: 'transparent',
    transition: 'height 0.1s, background 0.1s',
    boxSizing: 'border-box',
  },
  dropBarActive: {
    height: 24,
    background: 'rgba(99,102,241,0.25)',
    border: '2px dashed #6366f1',
  },
  placeholderCard: {
    margin: '8px 0',
    padding: '2rem',
    background: '#f8fafc',
    border: '2px dashed #cbd5e1',
    borderRadius: 8,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyZone: {
    minHeight: 120,
    border: '2px dashed #cbd5e1',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: 14,
    margin: '8px 0',
    transition: 'background 0.12s, border-color 0.12s',
  },
  emptyZoneActive: {
    background: 'rgba(99,102,241,0.08)',
    borderColor: '#6366f1',
    color: '#6366f1',
  },
  addButton: {
    display: 'block',
    width: '100%',
    margin: '8px 0',
    padding: '10px',
    background: 'transparent',
    border: '2px dashed #6366f1',
    borderRadius: 6,
    color: '#6366f1',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    letterSpacing: '0.03em',
  },
} as const;
