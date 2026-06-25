'use client';

import { createContext, DragEvent, useContext } from 'react';
import type { Component, ComponentInstance } from '../ComponentBuilder/models';
import type { TemplateZone } from '../ComponentBuilder/zones';

export type ZoneBuilderContextValue = {
  zones: TemplateZone[];
  components: Component[];
  draggedComponent: { component: Component; sourceZoneId?: string } | null;
  editingInstance: ComponentInstance | null;
  isAuthoringOpen: boolean;
  onDragStart: (component: Component, sourceZoneId?: string) => void;
  onZoneDrop: (zoneId: string, e: DragEvent) => void;
  onInstanceDelete: (zoneId: string, instanceId: string) => void;
  onInstanceClick: (instance: ComponentInstance) => void;
  onAuthoringOpenChange: (open: boolean) => void;
  onContentSave: (instanceId: string, content: Record<string, unknown>) => Promise<void>;
};

const ZoneBuilderContext = createContext<ZoneBuilderContextValue | null>(null);

export const ZoneBuilderProvider = ZoneBuilderContext.Provider;

export const useZoneBuilder = (): ZoneBuilderContextValue => {
  const ctx = useContext(ZoneBuilderContext);
  if (!ctx) throw new Error('useZoneBuilder must be used inside ZoneBuilderProvider');
  return ctx;
};
