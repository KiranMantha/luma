// ─── Luma Preview — React adapter ────────────────────────────────────────────
//
// React-specific layer. All framework-agnostic logic lives in luma-core.ts.
// Import MapTo + LumaProvider + Page here; drop luma-core.ts alongside for
// other framework adapters (Vue, Angular, Svelte, etc.) to share.

import type { CSSProperties, ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  CSS,
  MODE,
  canZoneAccept,
  endInstanceDrag,
  extractSectionData,
  fetchPageBySlug,
  getCurrentDrag,
  getPageSlugFromUrl,
  getZoneComponents,
  handleDropOnBar,
  hasContent,
  initPostMessageBridge,
  notifyAddComponent,
  notifyInstanceClick,
  offDragChange,
  onDragChange,
  setCurrentDrag,
  sortByOrder,
  startInstanceDrag,
  type ComponentData,
  type ComponentPayload,
  type PageModel,
  type PageModelPayload,
  type ZoneInfo,
} from './luma-core';

// ── Component registry ────────────────────────────────────────────────────────
// React-specific: stores ComponentType references.

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
export function MapTo(namespace: string, component: ComponentType<any>, config: MapToConfig = {}): void {
  componentRegistry[namespace] = { Component: component, config };
}

// ── useLumaMode ───────────────────────────────────────────────────────────────

export function useLumaMode(): 'edit' | 'preview' {
  return MODE;
}

// ── LumaProvider ──────────────────────────────────────────────────────────────
// Mount once at the app root. Initialises the postMessage bridge.

export function LumaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initPostMessageBridge(), []);
  return <>{children}</>;
}

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

  const handleDragOver = (e: React.DragEvent) => {
    if (!getCurrentDrag() || !canZoneAccept(zoneMaxComponents, zoneComponentCount)) return;
    e.preventDefault();
    e.stopPropagation();
    setOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    handleDropOnBar(afterIndex, zoneId, zoneMaxComponents, zoneComponentCount);
  };

  return (
    <div
      style={(over ? { ...CSS.dropBar, ...CSS.dropBarActive } : CSS.dropBar) as CSSProperties}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    />
  );
}

// ── EditableWrapper ───────────────────────────────────────────────────────────
// Subscribes to luma:component:<id> events to update its own content in place.

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
    onDragChange(setAnyDragging);
    return () => offDragChange(setAnyDragging);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setLiveConfig((e as CustomEvent<ComponentPayload>).detail.config);
    };
    window.addEventListener(`luma:component:${initialInstance.id}`, handler);
    return () => window.removeEventListener(`luma:component:${initialInstance.id}`, handler);
  }, [initialInstance.id]);

  const entry = componentRegistry[componentType];
  const displayName = entry?.config?.displayName ?? '';
  const instance = liveConfig !== null ? { ...initialInstance, config: liveConfig } : initialInstance;

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
        {!hasContent(instance.config) ? (
          <div style={CSS.placeholderCard as CSSProperties}>
            {entry?.config?.placeholder ?? `${displayName} — click Edit to add content`}
          </div>
        ) : entry ? (
          <entry.Component id={instance.id} {...instance.config} />
        ) : (
          <div style={{ padding: '1rem', color: '#dc2626', fontSize: 13 }}>
            [Luma] No component registered for &quot;{componentType}&quot;
          </div>
        )}
        <div
          style={{ ...CSS.overlay, ...(hovered ? CSS.overlayHover : {}) } as CSSProperties}
          draggable
          onDragStart={(e) => {
            isDraggingThis.current = true;
            startInstanceDrag(initialInstance.id, index, zoneId, e.dataTransfer);
            setTimeout(() => setHovered(false), 0);
          }}
          onDragEnd={() => {
            isDraggingThis.current = false;
            endInstanceDrag();
          }}
          onClick={(e) => {
            e.stopPropagation();
            notifyInstanceClick(instance.id, instance.componentId);
          }}
        />
        {hovered && (
          <button
            style={CSS.editBadge as CSSProperties}
            onClick={(e) => {
              e.stopPropagation();
              notifyInstanceClick(instance.id, instance.componentId);
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

function EmptyZoneDropTarget({ zoneName, locked }: { zoneName: string; locked: boolean }) {
  const [over, setOver] = useState(false);
  const [anyDragging, setAnyDragging] = useState(false);

  useEffect(() => {
    onDragChange(setAnyDragging);
    return () => offDragChange(setAnyDragging);
  }, []);

  if (!anyDragging || locked) {
    return (
      <div style={CSS.emptyZone as CSSProperties}>
        {locked ? `${zoneName} — locked` : `Drop components here into ${zoneName}`}
      </div>
    );
  }

  return (
    <div
      style={(over ? { ...CSS.emptyZone, ...CSS.emptyZoneActive } : { ...CSS.emptyZone, borderColor: '#6366f1' }) as CSSProperties}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
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

function AddComponentButton({ zoneId, afterIndex }: { zoneId: string; afterIndex: number | null }) {
  return (
    <button
      style={CSS.addButton as CSSProperties}
      onClick={() => notifyAddComponent(zoneId, afterIndex)}
    >
      + Add Component
    </button>
  );
}

// ── PageRenderer ──────────────────────────────────────────────────────────────

function PageRenderer({ components: initialComponents }: { components: ComponentData[] }) {
  const [editData, setEditData] = useState<{ zones: ZoneInfo[]; components: ComponentData[] }>({
    zones: [],
    components: initialComponents,
  });

  useEffect(() => {
    if (MODE !== 'edit') return;
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<PageModelPayload>).detail;
      setEditData({ zones: payload.zones, components: payload.components });
    };
    window.addEventListener('luma:pageModel', handler);
    return () => window.removeEventListener('luma:pageModel', handler);
  }, []);

  // ── Preview mode: flat render ─────────────────────────────────────────────
  // Public API spreads section data directly on the component object.
  // Strip known meta keys; pass everything else as props.
  if (MODE !== 'edit') {
    return (
      <>
        {sortByOrder(initialComponents).map((comp) => {
          const entry = componentRegistry[comp.type];
          if (!entry) return null;
          return <entry.Component key={comp.id} id={comp.id} {...extractSectionData(comp)} />;
        })}
      </>
    );
  }

  // ── Edit mode: zone-aware render driven by CMS postMessage ────────────────
  const { zones, components: allComponents } = editData;

  return (
    <>
      {sortByOrder(zones).map((zone) => {
        const zoneComponents = getZoneComponents(allComponents, zone.id);

        return (
          <div key={zone.id}>
            {zoneComponents.length === 0 ? (
              zone.locked ? (
                <EmptyZoneDropTarget zoneName={zone.name} locked={true} />
              ) : (
                <>
                  <EmptyZoneDropTarget zoneName={zone.name} locked={false} />
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
                {!zone.locked && (
                  <AddComponentButton zoneId={zone.id} afterIndex={zoneComponents.length - 1} />
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
// Top-level component. Handles fetch in preview mode; waits for postMessage in edit mode.

export function Page() {
  const [page, setPage] = useState<PageModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (MODE === 'edit') return;
    const slug = getPageSlugFromUrl();
    if (!slug) { setError('No page slug in URL path'); return; }
    fetchPageBySlug(slug).then(setPage).catch((err) => setError(err.message));
  }, []);

  if (MODE === 'edit') return <PageRenderer components={[]} />;
  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>Error: {error}</div>;
  if (!page) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading…</div>;
  return <PageRenderer components={page.components} />;
}

export type { ComponentData, ZoneInfo };
