// ─── Luma Preview — Vue adapter ───────────────────────────────────────────────
//
// Vue-specific layer. All framework-agnostic logic lives in luma-core.ts.
// Import MapTo + LumaProvider + Page here; drop luma-core.ts alongside for
// other framework adapters (React, Angular, Svelte, etc.) to share.

import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from 'vue';
import type { Component, VNode } from 'vue';
import {
  CSS,
  MODE,
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

type RegistryEntry = {
  component: Component;
  displayName?: string;
  placeholder?: string;
};

const componentRegistry: Record<string, RegistryEntry> = {};

export function MapTo(
  namespace: string,
  component: Component,
  config: { displayName?: string; placeholder?: string } = {},
): void {
  componentRegistry[namespace] = { component, ...config };
}

// ── useLumaMode ───────────────────────────────────────────────────────────────

export function useLumaMode(): 'edit' | 'preview' {
  return MODE;
}

// ── LumaProvider ──────────────────────────────────────────────────────────────
// Mount once at the app root. Initialises the postMessage bridge.

export const LumaProvider = defineComponent({
  name: 'LumaProvider',
  setup(_props, { slots }) {
    let cleanup: (() => void) | undefined;
    onMounted(() => { cleanup = initPostMessageBridge(); });
    onUnmounted(() => cleanup?.());
    return () => slots.default?.();
  },
});

// ── DropBar ───────────────────────────────────────────────────────────────────

const DropBar = defineComponent({
  name: 'DropBar',
  props: {
    afterIndex: { type: Number as () => number | null, default: null },
    zoneId: { type: String, required: true },
    zoneMaxComponents: { type: Number as () => number | null, default: null },
    zoneComponentCount: { type: Number, required: true },
  },
  setup(props) {
    const over = ref(false);

    const handleDragOver = (e: DragEvent) => {
      if (!getCurrentDrag() || !props.zoneMaxComponents || props.zoneComponentCount < props.zoneMaxComponents) {
        e.preventDefault();
        e.stopPropagation();
        over.value = true;
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      over.value = false;
      handleDropOnBar(props.afterIndex, props.zoneId, props.zoneMaxComponents, props.zoneComponentCount);
    };

    return () =>
      h('div', {
        style: over.value ? { ...CSS.dropBar, ...CSS.dropBarActive } : CSS.dropBar,
        onDragover: handleDragOver,
        onDragleave: () => { over.value = false; },
        onDrop: handleDrop,
      });
  },
});

// ── EditableWrapper ───────────────────────────────────────────────────────────

const EditableWrapper = defineComponent({
  name: 'EditableWrapper',
  props: {
    instance: { type: Object as () => ComponentData, required: true },
    componentType: { type: String, required: true },
    index: { type: Number, required: true },
    zoneId: { type: String, required: true },
    zoneMaxComponents: { type: Number as () => number | null, default: null },
    zoneComponentCount: { type: Number, required: true },
  },
  setup(props) {
    const hovered = ref(false);
    const anyDragging = ref(false);
    const liveConfig = shallowRef<Record<string, unknown> | null>(null);
    let isDraggingThis = false;

    const onDragChangeHandler = (d: boolean) => { anyDragging.value = d; };
    onMounted(() => onDragChange(onDragChangeHandler));
    onUnmounted(() => offDragChange(onDragChangeHandler));

    const componentEventHandler = (e: Event) => {
      liveConfig.value = (e as CustomEvent<ComponentPayload>).detail.config;
    };
    onMounted(() => window.addEventListener(`luma:component:${props.instance.id}`, componentEventHandler));
    onUnmounted(() => window.removeEventListener(`luma:component:${props.instance.id}`, componentEventHandler));

    const entry = computed(() => componentRegistry[props.componentType]);
    const displayName = computed(() => entry.value?.displayName ?? '');
    const instance = computed(() =>
      liveConfig.value !== null
        ? { ...props.instance, config: liveConfig.value }
        : props.instance,
    );
    const showDropBars = computed(() => anyDragging.value && !isDraggingThis);

    return () => {
      const nodes: VNode[] = [];

      if (showDropBars.value) {
        nodes.push(h(DropBar, {
          afterIndex: props.index - 1,
          zoneId: props.zoneId,
          zoneMaxComponents: props.zoneMaxComponents,
          zoneComponentCount: props.zoneComponentCount,
        }));
      }

      const config = instance.value.config as Record<string, unknown>;
      let innerContent: VNode;

      if (!hasContent(config)) {
        innerContent = h('div', { style: CSS.placeholderCard },
          entry.value?.placeholder ?? `${displayName.value} — click Edit to add content`);
      } else if (entry.value) {
        innerContent = h(entry.value.component as any, { id: instance.value.id, ...config });
      } else {
        innerContent = h('div', { style: { padding: '1rem', color: '#dc2626', fontSize: '13px' } },
          `[Luma] No component registered for "${props.componentType}"`);
      }

      const overlay = h('div', {
        style: { ...CSS.overlay, ...(hovered.value ? CSS.overlayHover : {}) },
        draggable: true,
        onDragstart: (e: DragEvent) => {
          isDraggingThis = true;
          startInstanceDrag(props.instance.id, props.index, props.zoneId, e.dataTransfer!);
          setTimeout(() => { hovered.value = false; }, 0);
        },
        onDragend: () => {
          isDraggingThis = false;
          endInstanceDrag();
        },
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          notifyInstanceClick(instance.value.id, instance.value.componentId);
        },
      });

      const editBadge = hovered.value
        ? h('button', {
          style: CSS.editBadge,
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            notifyInstanceClick(instance.value.id, instance.value.componentId);
          },
        }, `Edit · ${displayName.value}`)
        : null;

      nodes.push(h('div', {
        style: { position: 'relative' },
        onMouseenter: () => { hovered.value = true; },
        onMouseleave: () => { hovered.value = false; },
      }, [innerContent, overlay, editBadge].filter(Boolean) as VNode[]));

      return h('div', nodes);
    };
  },
});

// ── EmptyZoneDropTarget ────────────────────────────────────────────────────────

const EmptyZoneDropTarget = defineComponent({
  name: 'EmptyZoneDropTarget',
  props: {
    zoneName: { type: String, required: true },
    locked: { type: Boolean, required: true },
  },
  setup(props) {
    const over = ref(false);
    const anyDragging = ref(false);
    const onDragChangeHandler = (d: boolean) => { anyDragging.value = d; };
    onMounted(() => onDragChange(onDragChangeHandler));
    onUnmounted(() => offDragChange(onDragChangeHandler));

    return () => {
      if (!anyDragging.value || props.locked) {
        return h('div', { style: CSS.emptyZone },
          props.locked ? `${props.zoneName} — locked` : `Drop components here into ${props.zoneName}`);
      }
      return h('div', {
        style: over.value ? { ...CSS.emptyZone, ...CSS.emptyZoneActive } : { ...CSS.emptyZone, borderColor: '#6366f1' },
        onDragover: (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); over.value = true; },
        onDragleave: () => { over.value = false; },
        onDrop: (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); over.value = false; setCurrentDrag(null); },
      }, `Drop here → ${props.zoneName}`);
    };
  },
});

// ── AddComponentButton ────────────────────────────────────────────────────────

const AddComponentButton = defineComponent({
  name: 'AddComponentButton',
  props: {
    zoneId: { type: String, required: true },
    afterIndex: { type: Number as () => number | null, default: null },
  },
  setup(props) {
    return () =>
      h('button', {
        style: CSS.addButton,
        onClick: () => notifyAddComponent(props.zoneId, props.afterIndex),
      }, '+ Add Component');
  },
});

// ── PageRenderer ──────────────────────────────────────────────────────────────

export const PageRenderer = defineComponent({
  name: 'PageRenderer',
  props: {
    components: { type: Array as () => ComponentData[], required: true },
  },
  setup(props) {
    const editData = ref<{ zones: ZoneInfo[]; components: ComponentData[] }>({
      zones: [],
      components: props.components,
    });

    const pageModelHandler = (e: Event) => {
      const payload = (e as CustomEvent<PageModelPayload>).detail;
      editData.value = { zones: payload.zones, components: payload.components };
    };

    onMounted(() => {
      if (MODE === 'edit') window.addEventListener('luma:pageModel', pageModelHandler);
    });
    onUnmounted(() => {
      window.removeEventListener('luma:pageModel', pageModelHandler);
    });

    return () => {
      // ── Preview mode: flat render ───────────────────────────────────────────
      if (MODE !== 'edit') {
        const sorted = sortByOrder(props.components);
        if (!sorted.length) {
          return h('div', { style: { padding: '2rem', textAlign: 'center', color: '#94a3b8' } }, 'No components yet.');
        }
        return h('main', sorted.map((comp) => {
          const entry = componentRegistry[comp.type];
          if (!entry) return null;
          return h(entry.component as any, { key: comp.id, id: comp.id, ...extractSectionData(comp) });
        }).filter(Boolean) as VNode[]);
      }

      // ── Edit mode: zone-aware render driven by CMS postMessage ──────────────
      const { zones, components: allComponents } = editData.value;

      return h('div', sortByOrder(zones).map((zone) => {
        const zoneComponents = getZoneComponents(allComponents, zone.id);

        if (zoneComponents.length === 0) {
          const children: VNode[] = [h(EmptyZoneDropTarget, { zoneName: zone.name, locked: zone.locked })];
          if (!zone.locked) children.push(h(AddComponentButton, { zoneId: zone.id, afterIndex: null }));
          return h('div', { key: zone.id }, children);
        }

        return h('div', { key: zone.id }, [
          ...zoneComponents.map((comp, i) =>
            h(EditableWrapper, {
              key: comp.id,
              instance: comp,
              componentType: comp.type,
              index: i,
              zoneId: zone.id,
              zoneMaxComponents: zone.maxComponents,
              zoneComponentCount: zoneComponents.length,
            }),
          ),
          h(DropBar, {
            afterIndex: zoneComponents.length - 1,
            zoneId: zone.id,
            zoneMaxComponents: zone.maxComponents,
            zoneComponentCount: zoneComponents.length,
          }),
          ...(!zone.locked
            ? [h(AddComponentButton, { zoneId: zone.id, afterIndex: zoneComponents.length - 1 })]
            : []),
        ]);
      }));
    };
  },
});

// ── Page ──────────────────────────────────────────────────────────────────────
// Top-level component. Handles fetch in preview mode; waits for postMessage in edit mode.

export const Page = defineComponent({
  name: 'Page',
  setup() {
    const page = ref<PageModel | null>(null);
    const error = ref<string | null>(null);

    onMounted(async () => {
      if (MODE === 'edit') return;
      const slug = getPageSlugFromUrl();
      if (!slug) { error.value = 'No page slug in URL path'; return; }
      try {
        page.value = await fetchPageBySlug(slug);
      } catch (err) {
        error.value = (err as Error).message;
      }
    });

    return () => {
      if (MODE === 'edit') return h(PageRenderer, { components: [] });
      if (error.value) return h('div', { style: { padding: '2rem', color: '#dc2626' } }, `Error: ${error.value}`);
      if (!page.value) return h('div', { style: { padding: '2rem', color: '#94a3b8' } }, 'Loading…');
      return h(PageRenderer, { components: page.value.components });
    };
  },
});

export type { ComponentData, ZoneInfo };
