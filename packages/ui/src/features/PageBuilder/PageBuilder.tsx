'use client';

import { DragEvent, useState } from 'react';
import { Button, Flex, Text } from '../../atoms';
import type { Component, ComponentInstance, Page, Template } from '../ComponentBuilder/models';
import { PageStatus } from '../ComponentBuilder/models';
import { createDefaultPageZones, validateZonePlacement } from '../ComponentBuilder/zones';
import { ComponentContentAuthoring } from '../ComponentContentAuthoring/ComponentContentAuthoring';
import { ZoneBuilderProvider } from '../ZoneBuilder/ZoneBuilderContext';
import { ZoneDropArea } from '../ZoneBuilder/ZoneDropArea';
import styles from './PageBuilder.module.scss';

type PageBuilderProps = {
  page: Page;
  components: Component[];
  selectedTemplate?: Template;
  onSave: (page: Page) => Promise<void>;
  onCancel: () => void;
};

type DraggedComponent = {
  component: Component;
  sourceZoneId?: string;
};

export const PageBuilder = ({ page, components, selectedTemplate, onSave, onCancel }: PageBuilderProps) => {
  const zonesWithIds = (page.zones || createDefaultPageZones()).map((zone) => ({
    ...zone,
    componentInstances: zone.componentInstances.map((instance) => ({
      ...instance,
      id: instance.id || `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
  }));

  const [pageState, setPageState] = useState<Page>({ ...page, zones: zonesWithIds });
  const [draggedComponent, setDraggedComponent] = useState<DraggedComponent | null>(null);
  const [editingInstance, setEditingInstance] = useState<ComponentInstance | null>(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);

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

  const handleZoneDrop = (targetZoneId: string, e: DragEvent) => {
    e.preventDefault();
    if (!draggedComponent) return;

    const targetZone = pageState.zones?.find((z) => z.id === targetZoneId);
    if (!targetZone) return;

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

    setPageState((prev) => ({
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

    setDraggedComponent(null);
  };

  const handleInstanceDelete = (zoneId: string, instanceId: string) => {
    setPageState((prev) => ({
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
    setPageState((prev) => ({
      ...prev,
      zones: prev.zones.map((zone) => ({
        ...zone,
        componentInstances: zone.componentInstances.map((inst) =>
          inst.id === instanceId ? { ...inst, config: content } : inst,
        ),
      })),
    }));
    setEditingInstance(null);
    setIsAuthoringOpen(false);
  };

  const handleStatusChange = (newStatus: PageStatus) => {
    setPageState((prev) => ({ ...prev, status: newStatus }));
  };

  const handleSave = async () => {
    try {
      const cleanZones =
        pageState.zones?.map((zone) => ({
          ...zone,
          componentInstances: zone.componentInstances.map((inst) => ({
            id: inst.id,
            componentId: inst.componentId,
            config: { ...inst.config },
            order: inst.order,
          })),
        })) || [];

      await onSave({ ...pageState, zones: cleanZones } as Page);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save page: ${errorMessage}`);
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
                value={pageState.status}
                onChange={(e) => handleStatusChange(e.target.value as PageStatus)}
                className={styles.statusSelect}
              >
                <option value={PageStatus.DRAFT}>Draft</option>
                <option value={PageStatus.PUBLISHED}>Published</option>
                <option value={PageStatus.ARCHIVED}>Archived</option>
              </select>
            </Flex>
            <Text size="2" color="gray">
              {selectedTemplate ? `Using template: ${selectedTemplate.name}` : 'Blank page with body content only'}
            </Text>
          </div>
          <Flex gap="3" align="center">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Page
            </Button>
          </Flex>
        </div>

        <div className={styles.workspace}>
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
                      title={
                        isUsed
                          ? 'Component already used - remove it first to reuse'
                          : 'Drag to body zone to add to page content'
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
                })
              )}
            </div>
          </div>

          <div className={styles.zoneWorkspace}>
            {pageState.zones?.map((zone) => (
              <ZoneDropArea key={zone.id} zone={zone} />
            ))}
          </div>
        </div>

        <ComponentContentAuthoring
          open={isAuthoringOpen}
          onOpenChange={setIsAuthoringOpen}
          componentInstance={editingInstance}
          component={editingInstance ? components.find((c) => c.id === editingInstance.componentId) || null : null}
          page={pageState}
          onSave={handleContentSave}
        />
      </div>
    </ZoneBuilderProvider>
  );
};
