'use client';

import type { Component, ComponentInstance, Page, Template, TemplateZone } from '@repo/ui';
import { Button, createDefaultPageZones, Flex, Text, validateZonePlacement } from '@repo/ui';
import { useState } from 'react';
import { ComponentContentAuthoring } from '../templates/ComponentContentAuthoring';
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
  sourceZoneId?: string; // For moving between zones
};

export const PageBuilder = ({ page, components, selectedTemplate, onSave, onCancel }: PageBuilderProps) => {
  // Initialize zones - either from page or create default ones
  const initialZones = page.zones || createDefaultPageZones();

  // Ensure all component instances have unique IDs
  const zonesWithIds = initialZones.map((zone) => ({
    ...zone,
    componentInstances: zone.componentInstances.map((instance) => ({
      ...instance,
      id: instance.id || `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
  }));

  const [pageState, setPageState] = useState<Page>({
    ...page,
    zones: zonesWithIds,
  });
  const [draggedComponent, setDraggedComponent] = useState<DraggedComponent | null>(null);
  const [editingInstance, setEditingInstance] = useState<ComponentInstance | null>(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);

  // Get components used in the selected template to exclude them
  const getTemplateComponentIds = (): Set<string> => {
    const templateComponentIds = new Set<string>();

    if (selectedTemplate?.zones) {
      selectedTemplate.zones.forEach((zone) => {
        zone.componentInstances.forEach((instance) => {
          templateComponentIds.add(instance.componentId);
        });
      });
    }

    return templateComponentIds;
  };

  // Filter available components (exclude those used in template)
  const getAvailableComponents = () => {
    const templateComponentIds = getTemplateComponentIds();
    return components.filter((component) => !templateComponentIds.has(component.id));
  };

  // Track which components have been used in the page (single-use logic)
  const getUsedComponents = () => {
    const used = new Set<string>();
    pageState.zones?.forEach((zone) => {
      zone.componentInstances.forEach((instance) => {
        used.add(instance.componentId);
      });
    });
    return used;
  };

  const handleDragStart = (component: Component, sourceZoneId?: string) => {
    setDraggedComponent({ component, sourceZoneId });
  };

  const handleZoneDrop = (targetZoneId: string, e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedComponent) return;

    const targetZone = pageState.zones?.find((z) => z.id === targetZoneId);
    if (!targetZone) return;

    // Prevent dropping in locked zones
    if (targetZone.policy.locked) {
      alert('This zone is locked and cannot accept components');
      return;
    }

    // Single-use component check: prevent dropping if component is already used
    const usedComponents = getUsedComponents();
    if (usedComponents.has(draggedComponent.component.id) && !draggedComponent.sourceZoneId) {
      alert(
        `Component "${draggedComponent.component.name}" has already been used. Remove it first if you want to place it elsewhere.`,
      );
      return;
    }

    // Validate if component can be placed in this zone
    const validation = validateZonePlacement(
      targetZone.type,
      draggedComponent.component.id,
      targetZone.componentInstances.length,
    );

    if (!validation.valid) {
      alert(validation.reason); // TODO: Replace with proper toast notification
      return;
    }

    setPageState((prev) => {
      const newZones =
        prev.zones?.map((zone) => {
          if (zone.id === targetZoneId) {
            // Add component to target zone
            const newInstance: ComponentInstance = {
              id: `instance-${Date.now()}`,
              componentId: draggedComponent.component.id,
              position: { x: 0, y: zone.componentInstances.length * 60 }, // Stack vertically
              size: { width: 200, height: 50 },
              config: {},
              order: zone.componentInstances.length,
            };

            return {
              ...zone,
              componentInstances: [...zone.componentInstances, newInstance],
            };
          }

          // Remove from source zone if moving between zones
          if (zone.id === draggedComponent.sourceZoneId) {
            return {
              ...zone,
              componentInstances: zone.componentInstances.filter(
                (instance) => instance.componentId !== draggedComponent.component.id,
              ),
            };
          }

          return zone;
        }) || [];

      return { ...prev, zones: newZones };
    });

    setDraggedComponent(null);
  };

  const handleInstanceDelete = (zoneId: string, instanceId: string) => {
    setPageState((prev) => ({
      ...prev,
      zones:
        prev.zones?.map((zone) =>
          zone.id === zoneId
            ? {
                ...zone,
                componentInstances: zone.componentInstances.filter((i) => i.id !== instanceId),
              }
            : zone,
        ) || [],
    }));
  };

  const handleInstanceClick = (instance: ComponentInstance) => {
    setEditingInstance(instance);
    setIsAuthoringOpen(true);
  };

  const handleContentSave = (instanceId: string, content: Record<string, unknown>) => {
    setPageState((prev) => ({
      ...prev,
      zones: prev.zones.map((zone) => ({
        ...zone,
        componentInstances: zone.componentInstances.map((instance) =>
          instance.id === instanceId ? { ...instance, config: content } : instance,
        ),
      })),
    }));
    setEditingInstance(null);
    setIsAuthoringOpen(false);
  };

  const handleSave = async () => {
    try {
      // Clean zones - remove unnecessary fields from component instances
      const cleanZones =
        pageState.zones?.map((zone) => ({
          ...zone,
          componentInstances: zone.componentInstances.map((instance) => ({
            componentId: instance.componentId,
            config: { ...instance.config },
            order: instance.order,
          })),
        })) || [];

      const updatedPage = {
        ...pageState,
        zones: cleanZones,
      } as Page;

      await onSave(updatedPage);
    } catch (error) {
      console.error('Error saving page:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save page: ${errorMessage}`);
    }
  };

  const availableComponents = getAvailableComponents();

  return (
    <div className={styles.pageBuilder}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text size="5" weight="bold">
            Page Builder: {page.name}
          </Text>
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
        {/* Component Palette */}
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
                {selectedTemplate ? ' All components are used in the selected template.' : ' Create components first.'}
              </Text>
            ) : (
              availableComponents.map((component) => {
                const usedComponents = getUsedComponents();
                const isUsed = usedComponents.has(component.id);

                return (
                  <div
                    key={component.id}
                    className={`${styles.componentCard} ${isUsed ? styles.componentUsed : ''}`}
                    draggable={!isUsed}
                    onDragStart={() => !isUsed && handleDragStart(component)}
                    title={
                      isUsed ? 'Component already used - remove it first to reuse' : 'Drag to body zone to add to page'
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

        {/* Zone Workspace */}
        <div className={styles.zoneWorkspace}>
          <div className={styles.layoutGrid}>
            {pageState.zones?.map((zone) => (
              <ZoneDropArea
                key={zone.id}
                zone={zone}
                components={components}
                onDrop={(e) => handleZoneDrop(zone.id, e)}
                onInstanceDelete={(instanceId) => handleInstanceDelete(zone.id, instanceId)}
                onInstanceClick={handleInstanceClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Component Content Authoring Modal */}
      <ComponentContentAuthoring
        open={isAuthoringOpen}
        onOpenChange={setIsAuthoringOpen}
        componentInstance={editingInstance}
        component={editingInstance ? components.find((c) => c.id === editingInstance.componentId) || null : null}
        onSave={handleContentSave}
      />
    </div>
  );
};

type ZoneDropAreaProps = {
  zone: TemplateZone;
  components: Component[];
  onDrop: (e: React.DragEvent) => void;
  onInstanceDelete: (instanceId: string) => void;
  onInstanceClick: (instance: ComponentInstance) => void;
};

const ZoneDropArea = ({ zone, components, onDrop, onInstanceDelete, onInstanceClick }: ZoneDropAreaProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      className={`${styles.zoneArea} ${isDragOver ? styles.dragOver : ''} border-green-200 bg-green-50`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.zoneHeader}>
        <Text size="2" weight="medium">
          {zone.name}
        </Text>
        <Text size="1" color="gray">
          {zone.componentInstances.length} component{zone.componentInstances.length !== 1 ? 's' : ''}
          {zone.policy.maxComponents && ` (max ${zone.policy.maxComponents})`}
        </Text>
      </div>

      <div className={styles.zoneContent}>
        {zone.componentInstances.length === 0 ? (
          <div className={styles.emptyZone}>
            <Text size="2" color="gray">
              Drop components here
            </Text>
            <Text size="1" color="gray">
              {zone.description || `Add ${zone.type} components`}
            </Text>
          </div>
        ) : (
          <div className={styles.instanceList}>
            {zone.componentInstances.map((instance) => {
              const component = components.find((c) => c.id === instance.componentId);
              return (
                <div key={instance.id} className={styles.zoneInstance}>
                  <div className={styles.instanceInfo} onClick={() => onInstanceClick(instance)}>
                    <Text size="2">{component?.name || 'Unknown'}</Text>
                    <Text size="1" color="gray">
                      Click to edit content
                    </Text>
                  </div>
                  <div className={styles.instanceActions}>
                    <Button size="sm" variant="ghost" color="blue" onClick={() => onInstanceClick(instance)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" color="red" onClick={() => onInstanceDelete(instance.id)}>
                      ×
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
