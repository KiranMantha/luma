export type Framework = 'react' | 'next' | 'vue' | 'angular' | 'svelte' | 'vanilla';

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: 'React',
  next: 'Next.js',
  vue: 'Vue 3',
  angular: 'Angular',
  svelte: 'Svelte / SvelteKit',
  vanilla: 'Vanilla JS',
};

// ---------------------------------------------------------------------------
// Shared vanilla core — identical in every snippet
// ---------------------------------------------------------------------------
const VANILLA_CORE = `
function initLumaReceiver() {
  const handler = (event) => {
    if (event.data?.source !== 'luma-cms') return;
    const { type, payload } = event.data;
    if (type === 'component-update') {
      document.dispatchEvent(
        new CustomEvent(\`luma:instance-\${payload.instanceId}\`, { detail: payload })
      );
    }
    if (type === 'page-update') {
      payload.instances.forEach((inst) =>
        document.dispatchEvent(
          new CustomEvent(\`luma:instance-\${inst.instanceId}\`, { detail: inst })
        )
      );
    }
  };
  window.addEventListener('message', handler);
  // Signal ready — CMS responds with full current page state
  window.parent?.postMessage({ source: 'luma-preview', type: 'ready' }, '*');
  return () => window.removeEventListener('message', handler);
}`.trim();

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------
const REACT_SNIPPET = `\
// ─── Luma Live Preview — React ────────────────────────────────────────────────
// Save as: src/lib/luma-preview.tsx
// No external dependencies — vanilla JS + React hooks only.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', YourComponent) in each component file.
//   2. Render <LumaProvider> once at your preview route root.
//   3. Render <PageRenderer components={page.components} /> to display the page.
//   4. In each component, call useLumaComponent(id) for live CMS updates.

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

// ── Component registry ────────────────────────────────────────────────────────

const componentRegistry: Record<string, ComponentType<{ component: any }>> = {};

export function MapTo(namespace: string, component: ComponentType<{ component: any }>) {
  componentRegistry[namespace] = component;
}

// ── postMessage receiver ──────────────────────────────────────────────────────

${VANILLA_CORE}

export function LumaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initLumaReceiver(), []);
  return <>{children}</>;
}

// ── useLumaComponent ──────────────────────────────────────────────────────────

/** Returns live CMS content for this instance, or null before the first update. */
export function useLumaComponent<T>(instanceId: string): T | null {
  const [content, setContent] = useState<T | null>(null);
  useEffect(() => {
    const handler = (e: Event) =>
      setContent((e as CustomEvent<{ content: T }>).detail.content);
    document.addEventListener(\`luma:instance-\${instanceId}\`, handler);
    return () => document.removeEventListener(\`luma:instance-\${instanceId}\`, handler);
  }, [instanceId]);
  return content;
}

// ── PageRenderer ──────────────────────────────────────────────────────────────

/** Loops over page.components, looks up each type in the registry, and renders it. */
export function PageRenderer({ components }: { components: any[] }) {
  if (!components?.length) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No components yet.</div>;
  }
  return (
    <main>
      {components.map((component) => {
        const Component = componentRegistry[component.type];
        if (!Component) {
          console.warn(\`[Luma] No component registered for type "\${component.type}"\`);
          return null;
        }
        return <Component key={component.id} component={component} />;
      })}
    </main>
  );
}

// ── Usage example ─────────────────────────────────────────────────────────────
//
// // src/components/HeroWrapper.tsx
// import { MapTo, useLumaComponent } from '@/lib/luma-preview';
//
// function HeroWrapper({ component }) {
//   const live = useLumaComponent(component.id);
//   const data = live ?? component;
//   return <h1>{data.general?.title}</h1>;
// }
// MapTo('my-project/components/hero', HeroWrapper);
//
// // src/pages/PreviewPage.tsx
// import { LumaProvider, PageRenderer } from '@/lib/luma-preview';
// import '../components/HeroWrapper'; // side-effect: registers the component
//
// export function PreviewPage({ page }) {
//   return <LumaProvider><PageRenderer components={page.components} /></LumaProvider>;
// }
`;

// ---------------------------------------------------------------------------
// Next.js
// ---------------------------------------------------------------------------
const NEXT_SNIPPET = `\
// ─── Luma Live Preview — Next.js (App Router) ────────────────────────────────
// Save as: src/lib/luma-preview.tsx
// No external dependencies — vanilla JS + React hooks only.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', YourComponent) in each component file.
//   2. Render <LumaProvider> in your preview route (client component).
//   3. Render <PageRenderer components={page.components} /> to display the page.
//   4. In each component, call useLumaComponent(id) for live CMS updates.

'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

// ── Component registry ────────────────────────────────────────────────────────

const componentRegistry: Record<string, ComponentType<{ component: any }>> = {};

export function MapTo(namespace: string, component: ComponentType<{ component: any }>) {
  componentRegistry[namespace] = component;
}

// ── postMessage receiver ──────────────────────────────────────────────────────

${VANILLA_CORE}

export function LumaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initLumaReceiver(), []);
  return <>{children}</>;
}

// ── useLumaComponent ──────────────────────────────────────────────────────────

/** Returns live CMS content for this instance, or null before the first update. */
export function useLumaComponent<T>(instanceId: string): T | null {
  const [content, setContent] = useState<T | null>(null);
  useEffect(() => {
    const handler = (e: Event) =>
      setContent((e as CustomEvent<{ content: T }>).detail.content);
    document.addEventListener(\`luma:instance-\${instanceId}\`, handler);
    return () => document.removeEventListener(\`luma:instance-\${instanceId}\`, handler);
  }, [instanceId]);
  return content;
}

// ── PageRenderer ──────────────────────────────────────────────────────────────

/** Loops over page.components, looks up each type in the registry, and renders it. */
export function PageRenderer({ components }: { components: any[] }) {
  if (!components?.length) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No components yet.</div>;
  }
  return (
    <main>
      {components.map((component) => {
        const Component = componentRegistry[component.type];
        if (!Component) {
          console.warn(\`[Luma] No component registered for type "\${component.type}"\`);
          return null;
        }
        return <Component key={component.id} component={component} />;
      })}
    </main>
  );
}

// ── Usage example ─────────────────────────────────────────────────────────────
//
// // components/HeroWrapper.tsx  ('use client')
// import { MapTo, useLumaComponent } from '@/lib/luma-preview';
//
// function HeroWrapper({ component }) {
//   const live = useLumaComponent(component.id);
//   const data = live ?? component;
//   return <h1>{data.general?.title}</h1>;
// }
// MapTo('my-project/components/hero', HeroWrapper);
//
// // app/preview/[slug]/page.tsx  (Server Component)
// import { LumaProvider, PageRenderer } from '@/lib/luma-preview';
// import '../components/HeroWrapper'; // side-effect: registers the component
//
// export default async function PreviewPage({ params }) {
//   const page = await fetchPageBySlug(params.slug);
//   return <LumaProvider><PageRenderer components={page.components} /></LumaProvider>;
// }
`;

// ---------------------------------------------------------------------------
// Vue 3
// ---------------------------------------------------------------------------
const VUE_SNIPPET = `\
// ─── Luma Live Preview — Vue 3 ───────────────────────────────────────────────
// Save as: src/lib/luma-preview.ts
// No external dependencies — vanilla JS + Vue 3 Composition API only.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', YourComponent) in each component file.
//   2. Call useLumaReceiver() once in your preview route's setup.
//   3. Use <PageRenderer :components="page.components" /> to display the page.
//   4. In each component, call useLumaComponent(id) for live CMS updates.

import { defineComponent, h, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import type { Component } from 'vue';

// ── Component registry ────────────────────────────────────────────────────────

const componentRegistry: Record<string, Component> = {};

export function MapTo(namespace: string, component: Component) {
  componentRegistry[namespace] = component;
}

// ── postMessage receiver ──────────────────────────────────────────────────────

${VANILLA_CORE}

export function useLumaReceiver() {
  let cleanup: (() => void) | undefined;
  onMounted(() => { cleanup = initLumaReceiver(); });
  onUnmounted(() => cleanup?.());
}

// ── useLumaComponent ──────────────────────────────────────────────────────────

/** Returns a reactive ref with live content, or null before the first update. */
export function useLumaComponent<T>(instanceId: string) {
  const content = ref<T | null>(null);
  const handler = (e: Event) => {
    content.value = (e as CustomEvent<{ content: T }>).detail.content;
  };
  onMounted(() => document.addEventListener(\`luma:instance-\${instanceId}\`, handler));
  onUnmounted(() => document.removeEventListener(\`luma:instance-\${instanceId}\`, handler));
  return content;
}

// ── PageRenderer ──────────────────────────────────────────────────────────────

/** Loops over page.components, looks up each type in the registry, and renders it. */
export const PageRenderer = defineComponent({
  props: { components: { type: Array, required: true } },
  setup(props) {
    return () => {
      const items = props.components as any[];
      if (!items?.length) {
        return h('div', { style: 'padding:2rem;text-align:center;color:#94a3b8' }, 'No components yet.');
      }
      return h('main', items.map((component) => {
        const Comp = componentRegistry[component.type];
        if (!Comp) {
          console.warn(\`[Luma] No component registered for type "\${component.type}"\`);
          return null;
        }
        return h(Comp, { key: component.id, component });
      }));
    };
  },
});

// ── Usage example ─────────────────────────────────────────────────────────────
//
// <!-- HeroWrapper.vue -->
// <script setup lang="ts">
// import { computed } from 'vue';
// import { MapTo, useLumaComponent } from '@/lib/luma-preview';
// const props = defineProps<{ component: any }>();
// const live = useLumaComponent(props.component.id);
// const data = computed(() => live.value ?? props.component);
// MapTo('my-project/components/hero', getCurrentInstance()!.type);
// </script>
// <template><h1>{{ data.general?.title }}</h1></template>
//
// <!-- App.vue / preview route -->
// <script setup>
// import { useLumaReceiver, PageRenderer } from '@/lib/luma-preview';
// import HeroWrapper from '@/components/HeroWrapper.vue'; // side-effect: MapTo runs
// useLumaReceiver();
// </script>
// <template><PageRenderer :components="page.components" /></template>
`;

// ---------------------------------------------------------------------------
// Angular
// ---------------------------------------------------------------------------
const ANGULAR_SNIPPET = `\
// ─── Luma Live Preview — Angular ─────────────────────────────────────────────
// Save as: src/lib/luma-preview.ts
// No external dependencies — vanilla JS + Angular signals/services only.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', YourComponent) in each component file.
//   2. Inject LumaService and call init() in your preview component's ngOnInit.
//   3. Use <luma-page-renderer [components]="page.components" /> to display the page.
//   4. In each component, call lumaService.getLiveContent(id) for a live signal.

import {
  Component, Injectable, Input, NgModule, OnDestroy,
  Signal, Type, signal, ViewContainerRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ── Component registry ────────────────────────────────────────────────────────

const componentRegistry: Record<string, Type<any>> = {};

export function MapTo(namespace: string, component: Type<any>) {
  componentRegistry[namespace] = component;
}

// ── postMessage receiver ──────────────────────────────────────────────────────

${VANILLA_CORE}

@Injectable({ providedIn: 'root' })
export class LumaService implements OnDestroy {
  private cleanup?: () => void;
  private signals = new Map<string, ReturnType<typeof signal<unknown>>>();

  init() {
    if (this.cleanup) return;
    this.cleanup = initLumaReceiver();
  }

  getLiveContent<T>(instanceId: string): Signal<T | null> {
    if (!this.signals.has(instanceId)) {
      const s = signal<T | null>(null);
      this.signals.set(instanceId, s as ReturnType<typeof signal<unknown>>);
      document.addEventListener(\`luma:instance-\${instanceId}\`, (e: Event) => {
        s.set((e as CustomEvent<{ content: T }>).detail.content);
      });
    }
    return this.signals.get(instanceId) as Signal<T | null>;
  }

  ngOnDestroy() { this.cleanup?.(); }
}

// ── PageRenderer ──────────────────────────────────────────────────────────────

@Component({
  selector: 'luma-page-renderer',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <main>
      <ng-container #host />
    </main>
  \`,
})
export class PageRendererComponent implements OnDestroy {
  private vcr = inject(ViewContainerRef);
  private refs: any[] = [];

  @Input() set components(items: any[]) {
    this.vcr.clear();
    this.refs = [];
    (items ?? []).forEach((component) => {
      const Comp = componentRegistry[component.type];
      if (!Comp) { console.warn(\`[Luma] No component registered for type "\${component.type}"\`); return; }
      const ref = this.vcr.createComponent(Comp);
      ref.setInput('component', component);
      this.refs.push(ref);
    });
  }

  ngOnDestroy() { this.refs.forEach((r) => r.destroy()); }
}

// ── Usage example ─────────────────────────────────────────────────────────────
//
// // hero.component.ts
// import { Component, Input, computed, inject } from '@angular/core';
// import { MapTo, LumaService } from '../lib/luma-preview';
//
// @Component({ selector: 'app-hero', standalone: true, template: '<h1>{{ data().general?.title }}</h1>' })
// export class HeroComponent {
//   @Input() component!: any;
//   luma = inject(LumaService);
//   data = computed(() => this.luma.getLiveContent(this.component.id)() ?? this.component);
// }
// MapTo('my-project/components/hero', HeroComponent);
//
// // app.component.ts
// import { LumaService, PageRendererComponent } from '../lib/luma-preview';
// import { HeroComponent } from './components/hero.component'; // side-effect: MapTo runs
//
// @Component({ imports: [PageRendererComponent], template: '<luma-page-renderer [components]="page.components" />' })
// export class AppComponent { constructor(luma: LumaService) { luma.init(); } }
`;

// ---------------------------------------------------------------------------
// Svelte / SvelteKit
// ---------------------------------------------------------------------------
const SVELTE_SNIPPET = `\
// ─── Luma Live Preview — Svelte / SvelteKit ──────────────────────────────────
// Save as: src/lib/luma-preview.ts
// No external dependencies — vanilla JS + Svelte stores only.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', YourComponent) in each component file.
//   2. Call setupLumaReceiver() once in your preview route's onMount.
//   3. Use <PageRenderer components={page.components} /> to display the page.
//   4. In each component, call useLumaComponent(id) for a live store.

import { onDestroy, onMount } from 'svelte';
import { readable } from 'svelte/store';
import type { SvelteComponent } from 'svelte';

// ── Component registry ────────────────────────────────────────────────────────

const componentRegistry: Record<string, typeof SvelteComponent> = {};

export function MapTo(namespace: string, component: typeof SvelteComponent) {
  componentRegistry[namespace] = component;
}

export function getRegistry() { return componentRegistry; }

// ── postMessage receiver ──────────────────────────────────────────────────────

${VANILLA_CORE}

export function setupLumaReceiver() {
  let cleanup: (() => void) | undefined;
  onMount(() => { cleanup = initLumaReceiver(); });
  onDestroy(() => cleanup?.());
}

// ── useLumaComponent ──────────────────────────────────────────────────────────

/** Returns a readable store with live content, or null before the first update. */
export function useLumaComponent<T>(instanceId: string) {
  return readable<T | null>(null, (set) => {
    const handler = (e: Event) =>
      set((e as CustomEvent<{ content: T }>).detail.content);
    document.addEventListener(\`luma:instance-\${instanceId}\`, handler);
    return () => document.removeEventListener(\`luma:instance-\${instanceId}\`, handler);
  });
}

// ── Usage example ─────────────────────────────────────────────────────────────
//
// <!-- HeroWrapper.svelte -->
// <script lang="ts">
//   import { MapTo, useLumaComponent } from '$lib/luma-preview';
//   export let component: any;
//   const live = useLumaComponent(component.id);
//   $: data = $live ?? component;
//   MapTo('my-project/components/hero', ???); // pass the component class
// </script>
// <h1>{data.general?.title}</h1>
//
// <!-- PageRenderer.svelte -->
// <script lang="ts">
//   import { getRegistry } from '$lib/luma-preview';
//   export let components: any[];
//   const registry = getRegistry();
// </script>
// {#each components as component (component.id)}
//   <svelte:component this={registry[component.type]} {component} />
// {/each}
//
// <!-- +page.svelte (preview route) -->
// <script>
//   import { setupLumaReceiver } from '$lib/luma-preview';
//   import PageRenderer from '$lib/PageRenderer.svelte';
//   import HeroWrapper from '$lib/HeroWrapper.svelte'; // side-effect: MapTo runs
//   export let data;
//   setupLumaReceiver();
// </script>
// <PageRenderer components={data.page.components} />
`;

// ---------------------------------------------------------------------------
// Vanilla JS
// ---------------------------------------------------------------------------
const VANILLA_SNIPPET = `\
// ─── Luma Live Preview — Vanilla JS ──────────────────────────────────────────
// Save as: luma-preview.js (or .ts)
// No external dependencies required.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', renderFn) to register render functions.
//   2. Call initLumaReceiver() once when your preview page loads.
//   3. Call renderPage(components, container) to display the page.
//   4. Call onLumaUpdate(id, callback) for live updates per instance.

// ── Component registry ────────────────────────────────────────────────────────

const componentRegistry = {};

export function MapTo(namespace, renderFn) {
  componentRegistry[namespace] = renderFn;
}

// ── postMessage receiver ──────────────────────────────────────────────────────

${VANILLA_CORE}

// ── onLumaUpdate ─────────────────────────────────────────────────────────────

export function onLumaUpdate(instanceId, callback) {
  const handler = (e) => callback(e.detail.content);
  document.addEventListener(\`luma:instance-\${instanceId}\`, handler);
  return () => document.removeEventListener(\`luma:instance-\${instanceId}\`, handler);
}

// ── renderPage ────────────────────────────────────────────────────────────────

export function renderPage(components, container) {
  container.innerHTML = '';
  (components ?? []).forEach((component) => {
    const renderFn = componentRegistry[component.type];
    if (!renderFn) { console.warn(\`[Luma] No component registered for type "\${component.type}"\`); return; }
    const el = document.createElement('div');
    renderFn(el, component);
    container.appendChild(el);
    onLumaUpdate(component.id, (live) => { el.innerHTML = ''; renderFn(el, live ?? component); });
  });
}

// ── Usage example ─────────────────────────────────────────────────────────────
//
// import { MapTo, initLumaReceiver, renderPage } from './luma-preview.js';
//
// // Register components
// MapTo('my-project/components/hero', (el, data) => {
//   el.innerHTML = \`<h1>\${data.general?.title ?? ''}</h1>\`;
// });
//
// // On page load
// initLumaReceiver();
// const page = await fetch('/api/pages/slug/home').then(r => r.json());
// renderPage(page.components, document.querySelector('#app'));
`;

export function getSnippet(framework: Framework): string {
  switch (framework) {
    case 'react':   return REACT_SNIPPET;
    case 'next':    return NEXT_SNIPPET;
    case 'vue':     return VUE_SNIPPET;
    case 'angular': return ANGULAR_SNIPPET;
    case 'svelte':  return SVELTE_SNIPPET;
    case 'vanilla': return VANILLA_SNIPPET;
  }
}
