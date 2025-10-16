'use client';

import { Button } from '#atoms';
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

  return (
    <div className={styles.componentPreviewContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{component.name} Preview</h2>

        {onAddControl && (
          <Button onClick={onAddControl} size="2">
            + Add Control
          </Button>
        )}
      </div>

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
              <p className={styles.emptyText}>
                No controls added yet. Click &quot;Add Control&quot; to start building your component.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

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
    }

    return metadataItems.join(' • ');
  };

  return (
    <div className={styles.controlPreview}>
      <div className={styles.controlHeader}>
        <span className={styles.controlLabel}>{baseConfig.label || 'Unlabeled Control'}</span>
        <div className={styles.controlActions}>
          <span className={styles.controlMeta}>{getControlMetadata()}</span>
          {baseConfig.required && <span className={styles.requiredIndicator}>Required</span>}
          <Button size="1" variant="outline" onClick={() => onEditControl?.(control)}>
            Edit
          </Button>
          <Button size="1" variant="outline" color="red" onClick={() => onDeleteControl?.(control.id)}>
            Delete
          </Button>
        </div>
      </div>
      {baseConfig.placeholder && <p className={styles.placeholderText}>Placeholder: {baseConfig.placeholder}</p>}
    </div>
  );
};
