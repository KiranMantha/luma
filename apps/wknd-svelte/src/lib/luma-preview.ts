// ─── Luma Preview — Svelte adapter ────────────────────────────────────────────
//
// Svelte-specific layer. All framework-agnostic logic lives in luma-core.ts.
// Stateful UI components (EditableWrapper, PageRenderer, Page, LumaProvider)
// live in .svelte files so they can use Svelte 5 runes and template syntax.

import { onDestroy, onMount } from 'svelte';
import {
  initPostMessageBridge,
  type ComponentData,
  type ZoneInfo,
} from './luma-core';

export type { ComponentData, ZoneInfo };

// ── Component registry ────────────────────────────────────────────────────────

type RegistryEntry = {
  component: unknown;
  displayName?: string;
  placeholder?: string;
};

const componentRegistry: Record<string, RegistryEntry> = {};

export function MapTo(
  namespace: string,
  component: unknown,
  config: { displayName?: string; placeholder?: string } = {},
): void {
  componentRegistry[namespace] = { component, ...config };
}

export function getRegistry(): Record<string, RegistryEntry> {
  return componentRegistry;
}

// Convert a camelCase style object to an inline style string for Svelte templates.
export function toStyle(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
    .join(';');
}

// ── postMessage bridge ────────────────────────────────────────────────────────
// Call from the root component (LumaProvider or App).

export function setupLumaBridge(): void {
  let cleanup: (() => void) | undefined;
  onMount(() => { cleanup = initPostMessageBridge(); });
  onDestroy(() => cleanup?.());
}

// Re-export everything from luma-core that svelte components need directly
export {
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
  notifyAddComponent,
  notifyInstanceClick,
  offDragChange,
  onDragChange,
  setCurrentDrag,
  sortByOrder,
  startInstanceDrag,
  type ComponentPayload,
  type PageModel,
  type PageModelPayload,
} from './luma-core';
