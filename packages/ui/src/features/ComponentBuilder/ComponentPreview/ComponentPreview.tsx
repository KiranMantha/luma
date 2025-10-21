'use client';

import { Button, Flex, Text } from '#atoms';
import { Card } from '#molecules';
import type { ControlInstance } from '../models';
import type { BaseControlConfig, ComponentPreviewProps } from './ComponentPreview.model';
import { CONTROL_METADATA, ControlType } from './ComponentPreview.model';
import styles from './ComponentPreview.module.scss';

export const ComponentPreview = ({
  component,
  onAddControl,
  onEditControl,
  onDeleteControl,
}: ComponentPreviewProps) => {
  if (!component) {
    return <div className={styles.componentPreviewContainer} />;
  }

  const renderControlPreview = (
    control: ControlInstance,
    onEditControl?: (control: ControlInstance) => void,
    onDeleteControl?: (controlId: string) => void,
  ) => {
    // Get base config that all controls share
    const baseConfig = control.config as BaseControlConfig;

    // Get metadata for this control type
    const metadata = CONTROL_METADATA[control.controlType];

    if (!metadata) {
      return (
        <div className={styles.unknownControl}>
          <span>Unknown control type: {control.controlType}</span>
        </div>
      );
    }

    // Generate metadata display based on control characteristics
    const getControlMetadata = () => {
      const metadataItems: string[] = [metadata.displayName];
      const config = control.config as Record<string, unknown>;

      // Add specific characteristics based on our 5 control types
      switch (control.controlType) {
        case ControlType.TEXT:
          if (config.multiline) {
            metadataItems[0] = 'Multiline Text';
          }
          if (config.maxLength) {
            metadataItems.push(`Max: ${config.maxLength}`);
          }
          break;

        case ControlType.ENUMERATION:
          if (Array.isArray(config.options) && config.options.length) {
            metadataItems.push(`${config.options.length} options`);
          }
          break;

        case ControlType.MEDIA:
          if (config.allowedTypes) {
            metadataItems.push(`Types: ${(config.allowedTypes as string[]).join(', ')}`);
          }
          if (config.maxSize) {
            metadataItems.push(`Max: ${config.maxSize}MB`);
          }
          break;

        case ControlType.RICHTEXT:
          if (Array.isArray(config.toolbar) && config.toolbar.length) {
            metadataItems.push(`Tools: ${config.toolbar.length}`);
          }
          break;

        case ControlType.JSON:
          if (config.schema) {
            metadataItems.push('Schema validation');
          }
          if (config.pretty) {
            metadataItems.push('Pretty print');
          }
          break;

        case ControlType.TABLE:
          if (config.headers && Array.isArray(config.headers)) {
            metadataItems.push(`${config.headers.length} columns`);
          }
          if (config.caption) {
            metadataItems.push('With caption');
          }
          if (config.footnote) {
            metadataItems.push('With footnote');
          }
          break;
      }

      return metadataItems.join(' • ');
    };

    return (
      <Card className={styles.controlPreview}>
        <Flex justify="between">
          <Text size="3" weight="medium">
            {baseConfig.label || 'Unlabeled Control'}
          </Text>
          <Flex gap="2" className={styles.controlActions}>
            <Text size="1" className={styles.controlMeta}>
              {getControlMetadata()}
            </Text>
            {baseConfig.required && (
              <Text size="1" weight="medium" className={styles.requiredIndicator}>
                Required
              </Text>
            )}
            <Button size="sm" variant="primary-outline" onClick={() => onEditControl?.(control)}>
              Edit
            </Button>
            <Button size="sm" variant="danger-outline" onClick={() => onDeleteControl?.(control.id)}>
              Delete
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  };

  return (
    <div className={styles.componentPreviewContainer}>
      <Flex justify="between" className={styles.header}>
        <Text as="h2" size="5" weight="bold">
          {component.name} Preview
        </Text>

        {onAddControl && <Button onClick={onAddControl}>+ Add Control</Button>}
      </Flex>

      <Card className={styles.compositionArea}>
        <div className={styles.controlsList}>
          {component.controls && component.controls.length > 0 ? (
            component.controls.map((control) => (
              <div key={control.id} className={styles.controlItem}>
                {renderControlPreview(control, onEditControl, onDeleteControl)}
              </div>
            ))
          ) : (
            <div className={styles.emptyControls}>
              <Text size="3" className={styles.emptyText}>
                No controls added yet. Click &quot;Add Control&quot; to start building your component.
              </Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
