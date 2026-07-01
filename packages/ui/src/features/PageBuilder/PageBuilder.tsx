'use client';

import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Flex, Text } from '../../atoms';
import type { Component, ComponentInstance, Page, Template } from '../ComponentBuilder/models';
import { PageStatus } from '../ComponentBuilder/models';
import { createDefaultPageZones, validateZonePlacement } from '../ComponentBuilder/zones';
import { ComponentContentAuthoring } from '../ComponentContentAuthoring/ComponentContentAuthoring';
import { ComponentSelectionDialog } from '../ComponentSelectionDialog/ComponentSelectionDialog';
import { ZoneBuilderProvider } from '../ZoneBuilder/ZoneBuilderContext';
import { ZoneDropArea } from '../ZoneBuilder/ZoneDropArea';
import styles from './PageBuilder.module.scss';

// ── postMessage types ─────────────────────────────────────────────────────────
//
// CMS → iframe:
//   pageModel  — full page repaint (zones + flat components[])
//   component  — single-instance targeted update
//
// iframe → CMS:
//   ready, instance-click, instance-reorder, add-component

type ZoneInfo = {
  id: string;
  name: string;
  type: string;
  order: number;
  maxComponents: number | null;
  locked: boolean;
};

type ComponentData = {
  id: string;
  componentId: string;
  type: string;
  zoneId: string;
  order: number;
  config: Record<string, unknown>;
};

type PageModelPayload = {
  pageId: string;
  slug: string;
  zones: ZoneInfo[];
  components: ComponentData[];
};

type ComponentPayload = {
  instanceId: string;
  componentId: string;
  type: string;
  zoneId: string;
  order: number;
  config: Record<string, unknown>;
};

type LumaToIframe =
  | { source: 'luma-cms'; version: 1; type: 'pageModel'; payload: PageModelPayload }
  | { source: 'luma-cms'; version: 1; type: 'component'; payload: ComponentPayload };

type LumaFromIframe =
  | { source: 'luma-preview'; type: 'ready' }
  | { source: 'luma-preview'; type: 'instance-click'; instanceId: string; componentId: string }
  | { source: 'luma-preview'; type: 'instance-reorder'; fromIndex: number; toIndex: number; zoneId: string }
  | { source: 'luma-preview'; type: 'add-component'; zoneId: string; afterIndex: number | null };

// ── helpers ───────────────────────────────────────────────────────────────────

function makeInstanceId() {
  return `instance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const toKebabCase = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
const toCamelCase = (s: string) =>
  s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_: string, c: string) => c.toUpperCase());

// Mirrors the API's resolveInstanceContent: converts { [controlId]: value } raw config
// into { [sectionNameCamel]: { [labelCamel]: value } } using the in-memory component definition.
function resolveConfig(rawConfig: Record<string, unknown>, compDef: Component | undefined): Record<string, unknown> {
  if (!compDef?.sections?.length) return rawConfig;

  const resolved: Record<string, unknown> = {};
  for (const section of compDef.sections) {
    const sectionKey = toCamelCase(section.name);
    const sectionObj: Record<string, unknown> = {};

    for (const control of section.controls ?? []) {
      if (rawConfig[control.id] !== undefined) {
        sectionObj[toCamelCase(control.label || control.id)] = rawConfig[control.id];
      }
    }

    for (const fieldset of section.fieldsets ?? []) {
      const fieldsetKey = toCamelCase(fieldset.name);
      const scopedKey = `${section.id}:${fieldset.name}`;
      const raw = rawConfig[scopedKey] ?? rawConfig[fieldset.name];
      if (Array.isArray(raw)) {
        sectionObj[fieldsetKey] = raw.map((item: Record<string, unknown>) => {
          const mapped: Record<string, unknown> = {};
          for (const field of fieldset.fields ?? []) {
            if (item[field.id] !== undefined) mapped[toCamelCase(field.label || field.id)] = item[field.id];
          }
          return mapped;
        });
      } else {
        sectionObj[fieldsetKey] = [];
      }
    }

    resolved[sectionKey] = sectionObj;
  }
  return resolved;
}

function buildPageModelPayload(
  page: Page,
  allComponents: Component[],
  projectName: string | undefined,
): PageModelPayload {
  const zones: ZoneInfo[] = (page.zones || []).map((zone, idx) => ({
    id: zone.id,
    name: zone.name,
    type: zone.type,
    order: idx,
    maxComponents: zone.policy?.maxComponents ?? null,
    locked: zone.policy?.locked ?? false,
  }));

  const components: ComponentData[] = [];
  (page.zones || []).forEach((zone) => {
    zone.componentInstances.forEach((inst) => {
      const compDef = allComponents.find((c) => c.id === inst.componentId);
      const registryType = compDef
        ? projectName
          ? `${toKebabCase(projectName)}/components/${toCamelCase(compDef.name)}`
          : toCamelCase(compDef.name)
        : '';
      components.push({
        id: inst.id!,
        componentId: inst.componentId,
        type: registryType,
        zoneId: zone.id,
        order: inst.order ?? 0,
        config: resolveConfig(inst.config || {}, compDef),
      });
    });
  });

  return { pageId: page.id, slug: page.slug, zones, components };
}

function buildComponentPayload(
  inst: ComponentInstance,
  zoneId: string,
  allComponents: Component[],
  projectName: string | undefined,
): ComponentPayload {
  const compDef = allComponents.find((c) => c.id === inst.componentId);
  const registryType = compDef
    ? projectName
      ? `${toKebabCase(projectName)}/components/${toCamelCase(compDef.name)}`
      : toCamelCase(compDef.name)
    : '';
  return {
    instanceId: inst.id!,
    componentId: inst.componentId,
    type: registryType,
    zoneId,
    order: inst.order ?? 0,
    config: resolveConfig(inst.config || {}, compDef),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

type PageBuilderProps = {
  page: Page;
  components: Component[];
  selectedTemplate?: Template;
  /** Save current zones as a draft (persisted, can return later) */
  onSaveDraft: (page: Page) => Promise<Page>;
  /** Promote draft → published */
  onPublishPage: (pageId: string) => Promise<Page>;
  onCancel: () => void;
  previewUrl?: string;
  projectName?: string;
  /** Called by the CMS route when user picks a component via ComponentSelectionDialog */
  onAddComponentToPage?: (
    pageId: string,
    componentId: string,
    zoneId: string,
    afterIndex: number | null,
  ) => Promise<PageModelPayload>;
};

type DraggedComponent = {
  component: Component;
  sourceZoneId?: string;
};

type PendingAdd = { zoneId: string; afterIndex: number | null };

export const PageBuilder = ({
  page,
  components,
  selectedTemplate,
  onSaveDraft,
  onPublishPage,
  onCancel,
  previewUrl,
  projectName,
  onAddComponentToPage,
}: PageBuilderProps) => {
  const zonesWithIds = (page.zones || createDefaultPageZones()).map((zone) => ({
    ...zone,
    componentInstances: zone.componentInstances.map((instance) => ({
      ...instance,
      id: instance.id || makeInstanceId(),
    })),
  }));

  const [pageState, setPageState] = useState<Page>({ ...page, zones: zonesWithIds });
  // isDraft: true when there are unsaved local changes OR when the API reports a stored draft
  const [isDraft, setIsDraft] = useState(!!page.hasDraft);
  const [draggedComponent, setDraggedComponent] = useState<DraggedComponent | null>(null);
  const [editingInstance, setEditingInstance] = useState<ComponentInstance | null>(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const previewIframeSrc = previewUrl ? `${previewUrl.replace(/\/$/, '')}/${page.slug}?mode=edit` : undefined;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReadyRef = useRef(false);
  const pageStateRef = useRef(pageState);
  pageStateRef.current = pageState;

  const broadcastToIframe = useCallback(
    (msg: LumaToIframe) => {
      if (!previewUrl || !iframeReadyRef.current || !iframeRef.current?.contentWindow) return;
      try {
        iframeRef.current.contentWindow.postMessage(msg, new URL(previewUrl).origin);
      } catch {
        /* invalid URL */
      }
    },
    [previewUrl],
  );

  const sendPageModel = useCallback(
    (state: Page) => {
      broadcastToIframe({
        source: 'luma-cms',
        version: 1,
        type: 'pageModel',
        payload: buildPageModelPayload(state, components, projectName),
      });
    },
    [broadcastToIframe, components, projectName],
  );

  const markDraft = () => setIsDraft(true);

  // Listen for messages from the iframe
  useEffect(() => {
    if (!previewUrl) return;

    const handler = async (event: MessageEvent) => {
      const msg = event.data as LumaFromIframe;
      if (msg?.source !== 'luma-preview') return;

      if (msg.type === 'ready') {
        iframeReadyRef.current = true;
        sendPageModel(pageStateRef.current);
        return;
      }

      if (msg.type === 'instance-click') {
        let found: ComponentInstance | null = null;
        for (const zone of pageStateRef.current.zones ?? []) {
          const inst = zone.componentInstances.find((i) => i.id === msg.instanceId);
          if (inst) {
            found = { ...inst, componentId: msg.componentId || inst.componentId };
            break;
          }
        }
        if (found) {
          setEditingInstance(found);
          setIsAuthoringOpen(true);
        }
        return;
      }

      if (msg.type === 'instance-reorder') {
        markDraft();
        setPageState((prev) => {
          const newState = {
            ...prev,
            zones:
              prev.zones?.map((zone) => {
                if (zone.id !== msg.zoneId) return zone;
                const instances = [...zone.componentInstances];
                const [moved] = instances.splice(msg.fromIndex, 1);
                if (!moved) return zone;
                instances.splice(msg.toIndex, 0, moved);
                return { ...zone, componentInstances: instances.map((inst, order) => ({ ...inst, order })) };
              }) ?? [],
          };
          setTimeout(() => sendPageModel(newState), 0);
          return newState;
        });
        return;
      }

      if (msg.type === 'add-component') {
        // CMS opens ComponentSelectionDialog; record where to insert
        setPendingAdd({ zoneId: msg.zoneId, afterIndex: msg.afterIndex });
        setIsSelectionOpen(true);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [previewUrl, sendPageModel]);

  useEffect(() => {
    iframeReadyRef.current = false;
  }, [previewUrl]);

  // Called when user picks a component from ComponentSelectionDialog
  const handleComponentSelected = async (component: Component) => {
    if (!pendingAdd) return;
    const { zoneId, afterIndex } = pendingAdd;
    setPendingAdd(null);

    if (onAddComponentToPage) {
      markDraft();
      try {
        const pageModel = await onAddComponentToPage(pageState.id, component.id, zoneId, afterIndex);
        // Sync local state from the API response so CMS zone panel stays consistent
        setPageState((prev) => {
          const updatedZones =
            prev.zones?.map((zone) => {
              const zoneComponents = pageModel.components.filter((c) => c.zoneId === zone.id);
              return {
                ...zone,
                componentInstances: zoneComponents.map((c) => ({
                  id: c.id,
                  componentId: c.componentId,
                  config: c.config,
                  order: c.order,
                  position: { x: 0, y: 0 },
                  size: { width: 200, height: 50 },
                })),
              };
            }) ?? [];
          return { ...prev, zones: updatedZones };
        });
        broadcastToIframe({ source: 'luma-cms', version: 1, type: 'pageModel', payload: pageModel });
      } catch (err) {
        console.error('Failed to add component:', err);
      }
    } else {
      markDraft();
      setPageState((prev) => {
        const newState = {
          ...prev,
          zones:
            prev.zones?.map((zone) => {
              if (zone.id !== zoneId) return zone;
              const validation = validateZonePlacement(zone.type, component.id, zone.componentInstances.length);
              if (!validation.valid) return zone;
              const newInstance: ComponentInstance = {
                id: makeInstanceId(),
                componentId: component.id,
                position: { x: 0, y: 0 },
                size: { width: 200, height: 50 },
                config: {},
                order: afterIndex === null ? 0 : afterIndex + 1,
              };
              const instances = [...zone.componentInstances];
              const insertAt = afterIndex === null ? 0 : afterIndex + 1;
              instances.splice(insertAt, 0, newInstance);
              return { ...zone, componentInstances: instances.map((inst, order) => ({ ...inst, order })) };
            }) ?? [],
        };
        setTimeout(() => sendPageModel(newState), 0);
        return newState;
      });
    }
  };

  const getTemplateComponentIds = (): Set<string> => {
    const ids = new Set<string>();
    selectedTemplate?.zones?.forEach((zone) => zone.componentInstances.forEach((inst) => ids.add(inst.componentId)));
    return ids;
  };

  const getAvailableComponents = () => {
    const templateIds = getTemplateComponentIds();
    return components.filter((c) => !templateIds.has(c.id));
  };

  const getUsedComponents = () => {
    const used = new Set<string>();
    pageState.zones?.forEach((zone) => zone.componentInstances.forEach((inst) => used.add(inst.componentId)));
    return used;
  };

  const handleDragStart = (component: Component, sourceZoneId?: string) => {
    setDraggedComponent({ component, sourceZoneId });
  };

  const handleDragEnd = () => {
    setDraggedComponent(null);
  };

  const handleZoneDrop = (targetZoneId: string, e: DragEvent) => {
    e.preventDefault();
    if (!draggedComponent) return;

    const targetZone = pageState.zones?.find((z) => z.id === targetZoneId);
    if (!targetZone) return;

    const usedComponents = getUsedComponents();
    if (usedComponents.has(draggedComponent.component.id) && !draggedComponent.sourceZoneId) {
      alert(`Component "${draggedComponent.component.name}" has already been used. Remove it first.`);
      return;
    }

    const validation = validateZonePlacement(
      targetZone.type,
      draggedComponent.component.id,
      targetZone.componentInstances.length,
    );
    if (!validation.valid) {
      alert(validation.reason);
      return;
    }

    markDraft();
    setPageState((prev) => {
      const newState = {
        ...prev,
        zones:
          prev.zones?.map((zone) => {
            if (zone.id === targetZoneId) {
              const newInstance: ComponentInstance = {
                id: makeInstanceId(),
                componentId: draggedComponent.component.id,
                position: { x: 0, y: zone.componentInstances.length * 60 },
                size: { width: 200, height: 50 },
                config: {},
                order: zone.componentInstances.length,
              };
              return { ...zone, componentInstances: [...zone.componentInstances, newInstance] };
            }
            if (zone.id === draggedComponent.sourceZoneId) {
              return {
                ...zone,
                componentInstances: zone.componentInstances.filter(
                  (inst) => inst.componentId !== draggedComponent.component.id,
                ),
              };
            }
            return zone;
          }) || [],
      };
      setTimeout(() => sendPageModel(newState), 0);
      return newState;
    });

    setDraggedComponent(null);
  };

  const handleInstanceDelete = (zoneId: string, instanceId: string) => {
    markDraft();
    setPageState((prev) => {
      const newState = {
        ...prev,
        zones:
          prev.zones?.map((zone) =>
            zone.id === zoneId
              ? { ...zone, componentInstances: zone.componentInstances.filter((i) => i.id !== instanceId) }
              : zone,
          ) || [],
      };
      setTimeout(() => sendPageModel(newState), 0);
      return newState;
    });
  };

  const handleInstanceClick = (instance: ComponentInstance) => {
    setEditingInstance(instance);
    setIsAuthoringOpen(true);
  };

  const handleContentSave = async (instanceId: string, content: Record<string, unknown>) => {
    markDraft();
    // Find the instance's zone so we can build the component payload
    let savedZoneId = '';
    let savedInst: ComponentInstance | null = null;
    for (const zone of pageState.zones ?? []) {
      const inst = zone.componentInstances.find((i) => i.id === instanceId);
      if (inst) {
        savedZoneId = zone.id;
        savedInst = inst;
        break;
      }
    }

    setPageState((prev) => ({
      ...prev,
      zones: prev.zones.map((zone) => ({
        ...zone,
        componentInstances: zone.componentInstances.map((i) => (i.id === instanceId ? { ...i, config: content } : i)),
      })),
    }));

    // Send targeted component event so only that EditableWrapper re-renders
    if (savedInst) {
      const updatedInst = { ...savedInst, config: content };
      broadcastToIframe({
        source: 'luma-cms',
        version: 1,
        type: 'component',
        payload: buildComponentPayload(updatedInst, savedZoneId, components, projectName),
      });
    }

    setEditingInstance(null);
    setIsAuthoringOpen(false);
  };

  const buildCleanPage = (): Page => ({
    ...pageState,
    zones: (pageState.zones ?? []).map((zone) => ({
      ...zone,
      componentInstances: zone.componentInstances.map((inst) => ({
        id: inst.id,
        componentId: inst.componentId,
        position: inst.position ?? { x: 0, y: 0 },
        config: { ...inst.config },
        order: inst.order,
      })),
    })),
  });

  const handleSaveDraft = async () => {
    try {
      const saved = await onSaveDraft(buildCleanPage());
      setPageState((prev) => ({ ...prev, status: saved.status }));
      setIsDraft(true); // still a draft — not published
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Failed to save draft: ${msg}`);
    }
  };

  const handlePublish = async () => {
    try {
      const published = await onPublishPage(pageState.id);
      setPageState((prev) => ({ ...prev, status: published.status }));
      setIsDraft(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Failed to publish page: ${msg}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === PageStatus.PUBLISHED) {
      await handlePublish();
    } else if (newStatus === PageStatus.DRAFT) {
      await handleSaveDraft();
    }
  };

  const availableComponents = getAvailableComponents();

  return (
    <ZoneBuilderProvider
      value={{
        zones: pageState.zones || [],
        components,
        draggedComponent,
        editingInstance,
        isAuthoringOpen,
        onDragStart: handleDragStart,
        onZoneDrop: handleZoneDrop,
        onInstanceDelete: handleInstanceDelete,
        onInstanceClick: handleInstanceClick,
        onAuthoringOpenChange: setIsAuthoringOpen,
        onContentSave: handleContentSave,
      }}
    >
      <div className={styles.pageBuilder}>
        <div className={styles.header}>
          <div>
            <Text size="5" weight="bold">
              Page Builder: {page.name}
            </Text>
            <Flex gap="2" align="center" className="mb-1">
              <Text size="2" color="gray">
                Status:
              </Text>
              <select
                value={isDraft ? PageStatus.DRAFT : pageState.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={styles.statusSelect}
              >
                <option value={PageStatus.DRAFT}>Draft</option>
                <option value={PageStatus.PUBLISHED}>Published</option>
              </select>
              {isDraft && (
                <Text size="1" color="gray">
                  (unsaved changes)
                </Text>
              )}
            </Flex>
            <Text size="2" color="gray">
              {selectedTemplate ? `Using template: ${selectedTemplate.name}` : 'Blank page with body content only'}
            </Text>
          </div>
          <Flex gap="3" align="center">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveDraft}>
              Save Draft
            </Button>
          </Flex>
        </div>

        <div className={previewUrl ? styles.workspaceWithPreview : styles.workspace}>
          <div className={styles.palette}>
            <Text size="3" weight="medium" className={styles.paletteTitle}>
              Available Components
            </Text>
            {selectedTemplate && (
              <Text size="1" color="gray" className="mb-3">
                Components used in template are excluded
              </Text>
            )}
            <div className={styles.componentList}>
              {availableComponents.length === 0 ? (
                <Text size="2" color="gray">
                  No components available.
                  {selectedTemplate
                    ? ' All components are used in the selected template.'
                    : ' Create components first.'}
                </Text>
              ) : (
                availableComponents.map((component) => {
                  const isUsed = getUsedComponents().has(component.id);
                  return (
                    <div
                      key={component.id}
                      className={`${styles.componentCard} ${isUsed ? styles.componentUsed : ''}`}
                      draggable={!isUsed}
                      onDragStart={() => !isUsed && handleDragStart(component)}
                      onDragEnd={handleDragEnd}
                      title={isUsed ? 'Already used — remove first to reuse' : 'Drag to zone'}
                    >
                      <Text size="2" weight="medium" color={isUsed ? 'gray' : undefined}>
                        {component.name} {isUsed && '✓'}
                      </Text>
                      {component.description && (
                        <Text size="1" color="gray">
                          {component.description}
                        </Text>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {!previewUrl && (
            <div className={styles.zoneWorkspace}>
              {pageState.zones?.map((zone) => (
                <ZoneDropArea key={zone.id} zone={zone} />
              ))}
            </div>
          )}

          {previewUrl && (
            <div className={styles.previewPane}>
              <div className={styles.previewPaneHeader}>
                <span>Live Edit Preview</span>
                <span className={styles.previewPaneUrl}>({previewIframeSrc})</span>
              </div>
              <iframe
                ref={iframeRef}
                src={previewIframeSrc}
                className={styles.previewIframe}
                title="Live Edit Preview"
              />
            </div>
          )}
        </div>

        <ComponentContentAuthoring
          open={isAuthoringOpen}
          onOpenChange={setIsAuthoringOpen}
          componentInstance={editingInstance}
          component={editingInstance ? components.find((c) => c.id === editingInstance.componentId) || null : null}
          page={pageState}
          onSave={handleContentSave}
        />

        <ComponentSelectionDialog
          open={isSelectionOpen}
          onOpenChange={setIsSelectionOpen}
          components={availableComponents}
          onSelect={handleComponentSelected}
        />
      </div>
    </ZoneBuilderProvider>
  );
};
