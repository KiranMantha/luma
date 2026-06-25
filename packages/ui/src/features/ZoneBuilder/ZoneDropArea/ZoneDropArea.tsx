'use client';

import { useState } from 'react';
import { Button, Text } from '../../../atoms';
import type { TemplateZone } from '../../ComponentBuilder/zones';
import { useZoneBuilder } from '../ZoneBuilderContext';
import styles from './ZoneDropArea.module.scss';

const ZONE_TYPE_CLASSES: Record<string, string | undefined> = {
  header: styles.zoneHeader_color,
  hero: styles.zoneHero_color,
  content: styles.zoneContent_color,
  sidebar: styles.zoneSidebar_color,
  footer: styles.zoneFooter_color,
};

type Props = {
  zone: TemplateZone;
};

export const ZoneDropArea = ({ zone }: Props) => {
  const { components, onZoneDrop, onInstanceDelete, onInstanceClick } = useZoneBuilder();
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
    onZoneDrop(zone.id, e);
  };

  const zoneColorClass = zone.policy?.locked && zone.name === 'Body'
    ? styles.zoneLocked_color
    : ZONE_TYPE_CLASSES[zone.type] ?? styles.zoneCustom_color;

  return (
    <div
      className={`${styles.zoneArea} ${isDragOver ? styles.dragOver : ''} ${zoneColorClass}`}
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
          {zone.policy?.maxComponents ? ` (max ${zone.policy.maxComponents})` : ''}
        </Text>
      </div>

      <div className={styles.zoneContent}>
        {zone.componentInstances.length === 0 ? (
          <div className={styles.emptyZone}>
            <Text size="2" color="gray">
              {zone.policy?.locked ? 'Reserved for page content' : 'Drop components here'}
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
                      onClick={() => onInstanceDelete(zone.id, instance.id)}
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
