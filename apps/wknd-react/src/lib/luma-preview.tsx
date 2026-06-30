// ─── Luma Live Preview — React ────────────────────────────────────────────────
// No external dependencies — vanilla JS + React hooks only.
//
// Usage:
//   1. Call MapTo('<project>/components/<name>', YourComponent) to register components.
//   2. Render <LumaProvider> once at your preview route root.
//   3. Render <PageRenderer components={page.components} /> to display the page.
//   4. In each component, call useLumaComponent(id) for live CMS updates.

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

// ── Component registry ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentRegistry: Record<string, ComponentType<any>> = {};

export function MapTo(namespace: string, component: ComponentType<any>) {
  componentRegistry[namespace] = component;
}

// ── postMessage receiver ──────────────────────────────────────────────────────

function initLumaReceiver() {
  const handler = (event: MessageEvent) => {
    if (event.data?.source !== 'luma-cms') return;
    const { type, payload } = event.data;
    if (type === 'component-update') {
      document.dispatchEvent(new CustomEvent(`luma:instance-${payload.instanceId}`, { detail: payload }));
    }
    if (type === 'page-update') {
      payload.instances.forEach((inst: { instanceId: string }) =>
        document.dispatchEvent(new CustomEvent(`luma:instance-${inst.instanceId}`, { detail: inst })),
      );
    }
  };
  window.addEventListener('message', handler);
  window.parent?.postMessage({ source: 'luma-preview', type: 'ready' }, '*');
  return () => window.removeEventListener('message', handler);
}

// ── LumaProvider ──────────────────────────────────────────────────────────────

export function LumaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => initLumaReceiver(), []);
  return <>{children}</>;
}

// ── useLumaComponent ──────────────────────────────────────────────────────────

export function useLumaComponent<T>(instanceId: string): T | null {
  const [content, setContent] = useState<T | null>(null);
  useEffect(() => {
    const handler = (e: Event) => setContent((e as CustomEvent<{ content: T }>).detail.content);
    document.addEventListener(`luma:instance-${instanceId}`, handler);
    return () => document.removeEventListener(`luma:instance-${instanceId}`, handler);
  }, [instanceId]);
  return content;
}

// ── PageRenderer ──────────────────────────────────────────────────────────────

export function PageRenderer({ components }: { components: any[] }) {
  if (!components?.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        No components on this page yet. Add some in the CMS.
      </div>
    );
  }

  return (
    <>
      {components.map((component) => {
        const Component = componentRegistry[component.type];
        if (!Component) {
          console.warn(`[Luma] No component registered for type "${component.type}"`);
          return null;
        }
        return <Component key={component.id} {...component} />;
      })}
    </>
  );
}
