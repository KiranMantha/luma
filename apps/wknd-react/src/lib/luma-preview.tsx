// ─── Luma Live Preview — React ────────────────────────────────────────────────
//
// Two postMessage event types flow from CMS → iframe:
//   pageModel  — full page model (zones + components). PageRenderer repaints.
//   component  — single component's resolved data. EditableWrapper updates by instanceId.
//
// The iframe listener bridges postMessage → window CustomEvents.
// Wrappers hold zero business logic and make zero API calls in edit mode.

import type { CSSProperties, ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ComponentData, ZoneInfo } from './api';

// ── Mode detection ────────────────────────────────────────────────────────────

const MODE = new URLSearchParams(window.location.search).get('mode') as 'edit' | 'preview' | null;

export function useLumaMode(): 'edit' | 'preview' {
  return MODE === 'edit' ? 'edit' : 'preview';
}

// ── Component registry ────────────────────────────────────────────────────────

type MapToConfig = {
  placeholder?: string;
  displayName?: string;
};

type RegistryEntry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<any>;
  config: MapToConfig;
};

const componentRegistry: Record<string, RegistryEntry> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MapTo(namespace: string, component: ComponentType<any>, config: MapToConfig = {}) {
  componentRegistry[namespace] = { Component: component, config };
}

// ── postMessage protocol ──────────────────────────────────────────────────────
//
// CMS → iframe (two types only):
//   { source:'luma-cms', version:1, type:'pageModel',  payload: PageModelPayload }
//   { source:'luma-cms', version:1, type:'component',  payload: ComponentPayload }
//
// iframe → CMS (outbound):
//   ready, instance-click, instance-reorder, add-component
//
// The postMessage listener re-dispatches as window CustomEvents:
//   luma:pageModel              → PageRenderer
//   luma:component:<instanceId> → EditableWrapper

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

function sendToParent(msg: OutboundMsg) {
  window.parent?.postMessage(msg, '*');
}

// ── postMessage bridge → window CustomEvents ──────────────────────────────────
//
// This is the single place that receives postMessage and re-emits CustomEvents.
// Everything else (PageRenderer, EditableWrapper) subscribes to window events only.

function initLumaReceiver() {
  const handler = (event: MessageEvent) => {
    const msg = event.data as InboundMsg;
    if (msg?.source !== 'luma-cms') return;

    if (msg.type === 'pageModel') {
      window.dispatchEvent(new CustomEvent('luma:pageModel', { detail: msg.payload }));
    }

    if (msg.type === 'component') {
      window.dispatchEvent(new CustomEvent(`luma:component:${msg.payload.instanceId}`, { detail: msg.payload }));
    }
  };

  window.addEventListener('message', handler);
  sendToParent({ source: 'luma-preview', type: 'ready' });
  return () => window.removeEventListener('message', handler);
}

// ── LumaProvider ──────────────────────────────────────────────────────────────

export function LumaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initLumaReceiver(), []);
  return <>{children}</>;
}

// ── Drag state (module-level) ─────────────────────────────────────────────────

type DragState = { type: 'instance'; instanceId: string; index: number; zoneId: string } | null;

let currentDrag: DragState = null;

type DragListener = (dragging: boolean) => void;
const dragListeners = new Set<DragListener>();

function setCurrentDrag(val: DragState) {
  currentDrag = val;
  dragListeners.forEach((fn) => fn(val !== null));
}

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY: CSSProperties = {
  position: 'absolute',
  inset: 0,
  border: '2px solid transparent',
  boxSizing: 'border-box',
  cursor: 'grab',
  transition: 'border-color 0.12s, background 0.12s',
  zIndex: 10,
};

const OVERLAY_HOVER: CSSProperties = {
  borderColor: '#6366f1',
  background: 'rgba(99,102,241,0.04)',
};

const EDIT_BADGE: CSSProperties = {
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
};

const DROP_BAR: CSSProperties = {
  height: 6,
  borderRadius: 3,
  margin: '0 12px',
  background: 'transparent',
  transition: 'height 0.1s, background 0.1s',
  boxSizing: 'border-box',
};

const DROP_BAR_ACTIVE: CSSProperties = {
  height: 24,
  background: 'rgba(99,102,241,0.25)',
  border: '2px dashed #6366f1',
};

const PLACEHOLDER_CARD: CSSProperties = {
  margin: '8px 0',
  padding: '2rem',
  background: '#f8fafc',
  border: '2px dashed #cbd5e1',
  borderRadius: 8,
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: 14,
};

const EMPTY_ZONE: CSSProperties = {
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
};

const ADD_BTN: CSSProperties = {
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
};

// ── DropBar ───────────────────────────────────────────────────────────────────

function DropBar({
  afterIndex,
  zoneId,
  zoneMaxComponents,
  zoneComponentCount,
}: {
  afterIndex: number | null;
  zoneId: string;
  zoneMaxComponents: number | null;
  zoneComponentCount: number;
}) {
  const [over, setOver] = useState(false);

  const canAccept = () => {
    if (zoneMaxComponents !== null && zoneComponentCount >= zoneMaxComponents) return false;
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!currentDrag || !canAccept()) return;
    e.preventDefault();
    e.stopPropagation();
    setOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    if (!currentDrag || !canAccept()) return;

    if (currentDrag.type === 'instance') {
      const toIndex = afterIndex === null ? 0 : afterIndex + 1;
      if (currentDrag.index !== toIndex) {
        sendToParent({
          source: 'luma-preview',
          type: 'instance-reorder',
          fromIndex: currentDrag.index,
          toIndex,
          zoneId,
        });
      }
    }
    setCurrentDrag(null);
  };

  return (
    <div
      style={over ? { ...DROP_BAR, ...DROP_BAR_ACTIVE } : DROP_BAR}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    />
  );
}

// ── EditableWrapper ───────────────────────────────────────────────────────────
// Listens to luma:component:<instanceId> events to update its own content.
// No API calls, no business logic.

function EditableWrapper({
  instance: initialInstance,
  componentType,
  index,
  zoneId,
  zoneMaxComponents,
  zoneComponentCount,
}: {
  instance: ComponentData;
  componentType: string;
  index: number;
  zoneId: string;
  zoneMaxComponents: number | null;
  zoneComponentCount: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [anyDragging, setAnyDragging] = useState(false);
  const [liveConfig, setLiveConfig] = useState<Record<string, unknown> | null>(null);
  const isDraggingThis = useRef(false);

  useEffect(() => {
    dragListeners.add(setAnyDragging);
    return () => {
      dragListeners.delete(setAnyDragging);
    };
  }, []);

  // Listen for targeted component update events from the postMessage bridge
  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<ComponentPayload>).detail;
      setLiveConfig(payload.config);
    };
    window.addEventListener(`luma:component:${initialInstance.id}`, handler);
    return () => window.removeEventListener(`luma:component:${initialInstance.id}`, handler);
  }, [initialInstance.id]);

  const handleDragStart = (e: React.DragEvent) => {
    isDraggingThis.current = true;
    setCurrentDrag({ type: 'instance', instanceId: initialInstance.id, index, zoneId });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setHovered(false), 0);
  };

  const handleDragEnd = () => {
    isDraggingThis.current = false;
    if (currentDrag?.type === 'instance') setCurrentDrag(null);
  };

  const entry = componentRegistry[componentType];
  const displayName = entry?.config?.displayName || '';

  // Re-render the child component with live config when a component event arrives
  const instance = liveConfig !== null ? { ...initialInstance, config: liveConfig } : initialInstance;
  const hasContent = Object.keys(instance.config ?? {}).length > 0;
  const rendered = entry ? (
    <entry.Component key={instance.id} id={instance.id} {...instance.config} />
  ) : (
    <div style={{ padding: '1rem', color: '#dc2626', fontSize: 13 }}>
      [Luma] No component registered for &quot;{componentType}&quot;
    </div>
  );

  const showDropBars = anyDragging && !isDraggingThis.current;

  return (
    <>
      {showDropBars && (
        <DropBar
          afterIndex={index - 1}
          zoneId={zoneId}
          zoneMaxComponents={zoneMaxComponents}
          zoneComponentCount={zoneComponentCount}
        />
      )}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {!hasContent ? (
          <div style={PLACEHOLDER_CARD}>
            {entry?.config?.placeholder || `${displayName} — click Edit to add content`}
          </div>
        ) : (
          rendered
        )}
        <div
          style={{ ...OVERLAY, ...(hovered ? OVERLAY_HOVER : {}) }}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            e.stopPropagation();
            sendToParent({
              source: 'luma-preview',
              type: 'instance-click',
              instanceId: instance.id,
              componentId: instance.componentId,
            });
          }}
        />
        {hovered && (
          <button
            style={EDIT_BADGE}
            onClick={(e) => {
              e.stopPropagation();
              sendToParent({
                source: 'luma-preview',
                type: 'instance-click',
                instanceId: instance.id,
                componentId: instance.componentId,
              });
            }}
          >
            Edit · {displayName}
          </button>
        )}
      </div>
    </>
  );
}

// ── EmptyZoneDropTarget ────────────────────────────────────────────────────────

function EmptyZoneDropTarget({
  zoneId: _zoneId,
  zoneName,
  locked,
}: {
  zoneId: string;
  zoneName: string;
  locked: boolean;
}) {
  const [over, setOver] = useState(false);
  const [anyDragging, setAnyDragging] = useState(false);

  useEffect(() => {
    dragListeners.add(setAnyDragging);
    return () => {
      dragListeners.delete(setAnyDragging);
    };
  }, []);

  if (!anyDragging || locked) {
    return <div style={EMPTY_ZONE}>{locked ? `${zoneName} — locked` : `Drop components here into ${zoneName}`}</div>;
  }

  return (
    <div
      style={
        over
          ? { ...EMPTY_ZONE, background: 'rgba(99,102,241,0.08)', borderColor: '#6366f1', color: '#6366f1' }
          : { ...EMPTY_ZONE, borderColor: '#6366f1' }
      }
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        setCurrentDrag(null);
      }}
    >
      Drop here → {zoneName}
    </div>
  );
}

// ── AddComponentButton ────────────────────────────────────────────────────────
// Sends add-component to CMS; CMS shows its own ComponentSelectionDialog.

function AddComponentButton({ zoneId, afterIndex }: { zoneId: string; afterIndex: number | null }) {
  return (
    <button
      style={ADD_BTN}
      onClick={() => sendToParent({ source: 'luma-preview', type: 'add-component', zoneId, afterIndex })}
    >
      + Add Component
    </button>
  );
}

// ── PageRenderer ──────────────────────────────────────────────────────────────
// Preview mode: receives flat components[] from the public API, renders in order.
// Edit mode:    starts empty, repaints on luma:pageModel events from the CMS (zones + components).

type PageRendererProps = {
  components: ComponentData[];
  zones?: ZoneInfo[];
};

export function PageRenderer({ components: initialComponents, zones: initialZones }: PageRendererProps) {
  const mode = useLumaMode();

  // Edit mode state — populated entirely via postMessage from CMS
  const [editData, setEditData] = useState<{ zones: ZoneInfo[]; components: ComponentData[] }>({
    zones: initialZones ?? [],
    components: initialComponents,
  });

  useEffect(() => {
    if (mode !== 'edit') return;
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<PageModelPayload>).detail;
      setEditData({ zones: payload.zones, components: payload.components });
    };
    window.addEventListener('luma:pageModel', handler);
    return () => window.removeEventListener('luma:pageModel', handler);
  }, [mode]);

  // ── Preview mode: flat render, no zone awareness ──────────────────────────
  if (mode !== 'edit') {
    const ordered = [...initialComponents].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return (
      <>
        {ordered.map((comp) => {
          const entry = componentRegistry[comp.type];
          const { id, componentId, order, type, ...rest } = comp || {};
          return entry ? <entry.Component key={id} {...rest} /> : null;
        })}
      </>
    );
  }

  // ── Edit mode: zone-aware render driven by CMS postMessage ────────────────
  const { zones, components: allComponents } = editData;
  const orderedZones = [...zones].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      {orderedZones.map((zone) => {
        const zoneComponents = allComponents
          .filter((c) => c.zoneId === zone.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return (
          <div key={zone.id} style={{ flex: zone.type === 'content' ? 1 : undefined }}>
            {zoneComponents.length === 0 ? (
              zone.locked ? (
                <EmptyZoneDropTarget zoneId={zone.id} zoneName={zone.name} locked={true} />
              ) : (
                <>
                  <EmptyZoneDropTarget zoneId={zone.id} zoneName={zone.name} locked={false} />
                  <AddComponentButton zoneId={zone.id} afterIndex={null} />
                </>
              )
            ) : (
              <>
                {zoneComponents.map((comp, i) => (
                  <EditableWrapper
                    key={comp.id}
                    componentType={comp.type}
                    instance={comp}
                    index={i}
                    zoneId={zone.id}
                    zoneMaxComponents={zone.maxComponents}
                    zoneComponentCount={zoneComponents.length}
                  />
                ))}
                <DropBar
                  afterIndex={zoneComponents.length - 1}
                  zoneId={zone.id}
                  zoneMaxComponents={zone.maxComponents}
                  zoneComponentCount={zoneComponents.length}
                />
                {!zone.locked && <AddComponentButton zoneId={zone.id} afterIndex={zoneComponents.length - 1} />}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

export type { ComponentData, ZoneInfo };
