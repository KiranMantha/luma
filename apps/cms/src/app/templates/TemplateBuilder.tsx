'use client';

import type { Component, ComponentInstance, Template, TemplateLayout, TemplateZone } from '@repo/ui';
import { Button, createDefaultZones, Flex, TEMPLATE_LAYOUTS, Text, validateZonePlacement } from '@repo/ui';
import { DragEvent, useState } from 'react';
import { ComponentContentAuthoring } from './ComponentContentAuthoring';
import styles from './TemplateBuilder.module.scss';

type TemplateBuilderProps = {
  template: Template;
  components: Component[];
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
};

type DraggedComponent = {
  component: Component;
  sourceZoneId?: string; // For moving between zones
};

export const TemplateBuilder = ({ template, components, onSave, onCancel }: TemplateBuilderProps) => {
  // Initialize zones - either from template or create default ones
  const initialLayout: TemplateLayout = template.layout || 'header-footer';
  const initialZones = template.zones || createDefaultZones(initialLayout);

  // Ensure all component instances have unique IDs
  const zonesWithIds = initialZones.map((zone) => ({
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

  // Track which components have been used (single-use logic)
  const getUsedComponents = () => {
    const used = new Set<string>();
    templateState.zones?.forEach((zone) => {
      zone.componentInstances.forEach((instance) => {
        used.add(instance.componentId);
      });
    });
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

    // Prevent dropping in locked zones (like body placeholder)
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

    setTemplateState((prev) => {
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
    setTemplateState((prev) => ({
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
    setTemplateState((prev) => ({
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
        templateState.zones?.map((zone) => ({
          ...zone,
          componentInstances: zone.componentInstances.map((instance) => ({
            componentId: instance.componentId,
            config: { ...instance.config },
            order: instance.order,
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
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save template: ${errorMessage}`);
    }
  };

  return (
    <div className={styles.templateBuilder}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Text size="5" weight="bold">
            Template Builder: {template.name}
          </Text>
          <Text size="2" color="gray">
            Zone-based layout system
          </Text>
        </div>
        <Flex gap="3" align="center">
          <div className={styles.layoutSelector}>
            <Text size="2">Layout: Header + Footer</Text>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Template
          </Button>
        </Flex>
      </div>

      <div className={styles.workspace}>
        {/* Component Palette */}
        <div className={styles.palette}>
          <Text size="3" weight="medium" className={styles.paletteTitle}>
            Components
          </Text>
          <div className={styles.componentList}>
            {components.map((component) => {
              const usedComponents = getUsedComponents();
              const isUsed = usedComponents.has(component.id);

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

        {/* Zone Workspace */}
        <div className={styles.zoneWorkspace}>
          <div
            className={styles.layoutGrid}
            style={{
              gridTemplateAreas: TEMPLATE_LAYOUTS[selectedLayout].gridTemplateAreas,
              gridTemplateRows: TEMPLATE_LAYOUTS[selectedLayout].gridTemplateRows,
            }}
          >
            {templateState.zones?.map((zone) => (
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

  const getZoneTypeColor = (zone: TemplateZone) => {
    const colors: Record<string, string> = {
      header: 'border-blue-200 bg-blue-50',
      hero: 'border-purple-200 bg-purple-50',
      content: 'border-green-200 bg-green-50',
      sidebar: 'border-yellow-200 bg-yellow-50',
      footer: 'border-gray-200 bg-gray-50',
      custom: 'border-pink-200 bg-pink-50',
    };

    // Special styling for locked body placeholder
    if (zone.policy.locked && zone.name === 'Body') {
      return 'border-gray-300 bg-gray-100';
    }

    return colors[zone.type] || colors.custom;
  };

  return (
    <div
      className={`${styles.zoneArea} ${isDragOver ? styles.dragOver : ''} ${getZoneTypeColor(zone)}`}
      style={{ gridArea: zone.gridArea || zone.type }}
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
              {zone.policy.locked ? 'Reserved for page content' : 'Drop components here'}
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
                  <div className={styles.instanceInfo}>
                    <Text size="2">{component?.name || 'Unknown'}</Text>
                  </div>
                  <div className={styles.instanceActions}>
                    <Button size="sm" variant="primary-outline" onClick={() => onInstanceClick(instance)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="primary-outline"
                      color="red"
                      onClick={() => onInstanceDelete(instance.id)}
                    >
                      Delete
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
