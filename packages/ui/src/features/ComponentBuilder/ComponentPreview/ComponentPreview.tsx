'use client';

import { Button } from '#atoms';
import { Card } from '#molecules';
import type { ControlInstance } from '../models';
import type { ComponentPreviewProps, TextBoxConfig } from './ComponentPreview.model';
import styles from './ComponentPreview.module.scss';

export const ComponentPreview = ({ component, onAddControl, onEditControl }: ComponentPreviewProps) => {
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
                {renderControlPreview(control, onEditControl)}
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

const renderControlPreview = (control: ControlInstance, onEditControl?: (control: ControlInstance) => void) => {
  switch (control.controlType) {
    case 'textbox': {
      const config = control.config as unknown as TextBoxConfig;
      return (
        <div
          className={styles.controlPreview}
          onClick={() => onEditControl?.(control)}
          style={{ cursor: onEditControl ? 'pointer' : 'default' }}
        >
          <div className={styles.controlHeader}>
            <span className={styles.controlLabel}>{config.label}</span>
            <div className={styles.controlActions}>
              <span className={styles.controlMeta}>{config.multiline ? 'Textarea' : 'Text Input'}</span>
              {config.required && <span className={styles.requiredIndicator}>Required</span>}
              {onEditControl && <span className={styles.editIndicator}>Edit</span>}
            </div>
          </div>
          {config.placeholder && <p className={styles.placeholderText}>Placeholder: {config.placeholder}</p>}
        </div>
      );
    }
    default:
      return (
        <div className={styles.unknownControl}>
          <span>Unknown control type: {control.controlType}</span>
        </div>
      );
  }
};
