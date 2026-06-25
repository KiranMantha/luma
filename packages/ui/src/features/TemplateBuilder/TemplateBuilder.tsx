'use client';

import { DragEvent, useState } from 'react';
import { Button, Flex, Text } from '../../atoms';
import type { Component, ComponentInstance, Template } from '../ComponentBuilder/models';
import { createDefaultZones, TEMPLATE_LAYOUTS, TemplateLayout, validateZonePlacement } from '../ComponentBuilder/zones';
import { ComponentContentAuthoring } from '../ComponentContentAuthoring/ComponentContentAuthoring';
import { ZoneBuilderProvider } from '../ZoneBuilder/ZoneBuilderContext';
import { ZoneDropArea } from '../ZoneBuilder/ZoneDropArea';
import styles from './TemplateBuilder.module.scss';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;

type TemplateBuilderProps = {
  template: Template;
  components: Component[];
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
};

type DraggedComponent = {
  component: Component;
  sourceZoneId?: string;
};

export const TemplateBuilder = ({ template, components, onSave, onCancel }: TemplateBuilderProps) => {
  const initialLayout: TemplateLayout = template.layout || 'header-footer';
  const zonesWithIds = (template.zones || createDefaultZones(initialLayout)).map((zone) => ({
    ...zone,
    componentInstances: zone.componentInstances.map((instance) => ({
      ...instance,
      id: instance.id || `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
  }));

  const [templateState, setTemplateState] = useState<Template>({
    ...template,
    layout: initialLayout,
    zones: zonesWithIds,
  });
  const [draggedComponent, setDraggedComponent] = useState<DraggedComponent | null>(null);
  const [selectedLayout] = useState<TemplateLayout>(initialLayout);
  const [editingInstance, setEditingInstance] = useState<ComponentInstance | null>(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getUsedComponents = () => {
    const used = new Set<string>();
    templateState.zones?.forEach((zone) => zone.componentInstances.forEach((inst) => used.add(inst.componentId)));
    return used;
  };

  const handleDragStart = (component: Component, sourceZoneId?: string) => {
    setDraggedComponent({ component, sourceZoneId });
  };

  const handleZoneDrop = (targetZoneId: string, e: DragEvent) => {
    e.preventDefault();
    if (!draggedComponent) return;

    const targetZone = templateState.zones?.find((z) => z.id === targetZoneId);
    if (!targetZone) return;

    if (targetZone.policy.locked) {
      alert('This zone is locked and cannot accept components');
      return;
    }

    const usedComponents = getUsedComponents();
    if (usedComponents.has(draggedComponent.component.id) && !draggedComponent.sourceZoneId) {
      alert(
        `Component "${draggedComponent.component.name}" has already been used. Remove it first if you want to place it elsewhere.`,
      );
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

    setTemplateState((prev) => ({
      ...prev,
      zones:
        prev.zones?.map((zone) => {
          if (zone.id === targetZoneId) {
            const newInstance: ComponentInstance = {
              id: `instance-${Date.now()}`,
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
    }));

    setHasUnsavedChanges(true);
    setDraggedComponent(null);
  };

  const handleInstanceDelete = (zoneId: string, instanceId: string) => {
    setTemplateState((prev) => ({
      ...prev,
      zones:
        prev.zones?.map((zone) =>
          zone.id === zoneId
            ? { ...zone, componentInstances: zone.componentInstances.filter((i) => i.id !== instanceId) }
            : zone,
        ) || [],
    }));
  };

  const handleInstanceClick = (instance: ComponentInstance) => {
    setEditingInstance(instance);
    setIsAuthoringOpen(true);
  };

  const handleContentSave = async (instanceId: string, content: Record<string, unknown>) => {
    setTemplateState((prev) => ({
      ...prev,
      zones:
        prev.zones?.map((zone) => ({
          ...zone,
          componentInstances: zone.componentInstances.map((inst) =>
            inst.id === instanceId ? { ...inst, config: content } : inst,
          ),
        })) || [],
    }));
    setEditingInstance(null);
    setIsAuthoringOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanZones =
        templateState.zones?.map((zone) => ({
          ...zone,
          componentInstances: zone.componentInstances.map((inst) => ({
            componentId: inst.componentId,
            config: { ...inst.config },
            order: inst.order,
          })),
        })) || [];

      const updatedTemplate = {
        id: templateState.id,
        name: templateState.name,
        description: templateState.description,
        layout: templateState.layout,
        zones: cleanZones,
        metadata: {},
      } as Template;

      await onSave(updatedTemplate);
      setHasUnsavedChanges(false);
      alert('Template saved successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save template: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ZoneBuilderProvider
      value={{
        zones: templateState.zones || [],
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
      <div className={styles.templateBuilder}>
        <div className={styles.header}>
          <div>
            <Text size="5" weight="bold">
              Template Builder: {template.name}
            </Text>
            <Text size="2" color="gray">
              Zone-based layout system {hasUnsavedChanges && '• Unsaved changes'}
            </Text>
          </div>
          <Flex gap="3" align="center">
            <div className={styles.layoutSelector}>
              <Text size="2">Layout: Header + Footer</Text>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : hasUnsavedChanges ? '💾 Save Template*' : 'Save Template'}
            </Button>
          </Flex>
        </div>

        <div className={styles.workspace}>
          <div className={styles.palette}>
            <Text size="3" weight="medium" className={styles.paletteTitle}>
              Components
            </Text>
            <div className={styles.componentList}>
              {components.map((component) => {
                const isUsed = getUsedComponents().has(component.id);
                return (
                  <div
                    key={component.id}
                    className={`${styles.componentCard} ${isUsed ? styles.componentUsed : ''}`}
                    draggable={!isUsed}
                    onDragStart={() => !isUsed && handleDragStart(component)}
                    title={
                      isUsed
                        ? 'Component already used - remove it first to reuse'
                        : 'Drag to any zone - you decide where it belongs!'
                    }
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
              })}
            </div>
          </div>

          <div className={styles.zoneWorkspace}>
            <div
              className={styles.layoutGrid}
              style={{
                gridTemplateAreas: TEMPLATE_LAYOUTS[selectedLayout].gridTemplateAreas,
                gridTemplateRows: TEMPLATE_LAYOUTS[selectedLayout].gridTemplateRows,
              }}
            >
              {templateState.zones?.map((zone) => (
                <ZoneDropArea key={zone.id} zone={zone} />
              ))}
            </div>
          </div>
        </div>

        <ComponentContentAuthoring
          open={isAuthoringOpen}
          onOpenChange={setIsAuthoringOpen}
          componentInstance={editingInstance}
          component={editingInstance ? components.find((c) => c.id === editingInstance.componentId) || null : null}
          template={templateState}
          onContentSaved={handleContentSave}
        />
      </div>
    </ZoneBuilderProvider>
  );
};
