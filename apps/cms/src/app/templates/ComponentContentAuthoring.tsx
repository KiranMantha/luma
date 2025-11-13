'use client';

import type { Component, ComponentInstance, ControlInstance } from '@repo/ui';
import { Box, Button, ControlType, Input, Modal, Text, Textarea } from '@repo/ui';
import React, { useState } from 'react';
import styles from './ComponentContentAuthoring.module.scss';

type ComponentContentAuthoringProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentInstance: ComponentInstance | null;
  component: Component | null;
  onSave: (instanceId: string, content: Record<string, unknown>) => void;
};

export const ComponentContentAuthoring = ({
  open,
  onOpenChange,
  componentInstance,
  component,
  onSave,
}: ComponentContentAuthoringProps) => {
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  // Initialize content from component instance config when modal opens
  React.useEffect(() => {
    if (open && componentInstance) {
      setContent(componentInstance.config || {});
    }
  }, [open, componentInstance]);

  const handleSave = async () => {
    if (!componentInstance) return;

    setLoading(true);
    try {
      onSave(componentInstance.id, content);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save component content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setContent({});
  };

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setContent((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const renderControlInput = (control: ControlInstance) => {
    const fieldId = control.id;
    const currentValue = content[fieldId] || '';
    const config = control.config || {};

    switch (control.controlType) {
      case ControlType.TEXT: {
        const textConfig = config as { multiline?: boolean; placeholder?: string; maxLength?: number };
        return textConfig.multiline ? (
          <Textarea
            placeholder={textConfig.placeholder || `Enter ${control.label}`}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            placeholder={textConfig.placeholder || `Enter ${control.label}`}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            maxLength={textConfig.maxLength}
          />
        );
      }

      case ControlType.ENUMERATION: {
        const enumConfig = config as { options?: string[] };
        const options = enumConfig.options || [];
        return (
          <select
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Select an option...</option>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }

      case ControlType.MEDIA: {
        return (
          <div className={styles.mediaInput}>
            <Input
              placeholder="Enter image URL or upload"
              value={currentValue as string}
              onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            />
            {currentValue && (
              <div className={styles.mediaPreview}>
                <img
                  src={currentValue as string}
                  alt="Preview"
                  className={styles.previewImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );
      }

      case ControlType.RICHTEXT: {
        return (
          <Textarea
            placeholder={`Enter rich text content for ${control.label}`}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={6}
          />
        );
      }

      case ControlType.JSON: {
        return (
          <Textarea
            placeholder={`Enter JSON data for ${control.label}`}
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(fieldId, parsed);
              } catch {
                handleFieldChange(fieldId, e.target.value);
              }
            }}
            rows={4}
            className={styles.jsonInput}
          />
        );
      }

      case ControlType.TABLE: {
        const tableConfig = config as { headers?: Array<{ id: string; label: string }> };
        const headers = tableConfig.headers || [];
        const tableData = (currentValue as Record<string, string>[]) || [{}];

        return (
          <div className={styles.tableInput}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header.id}>{header.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => (
                      <td key={header.id}>
                        <Input
                          value={(row[header.id] as string) || ''}
                          onChange={(e) => {
                            const newTableData = [...tableData];
                            newTableData[rowIndex] = { ...row, [header.id]: e.target.value };
                            handleFieldChange(fieldId, newTableData);
                          }}
                          placeholder={`Enter ${header.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const newRow = headers.reduce((acc, header) => ({ ...acc, [header.id]: '' }), {});
                handleFieldChange(fieldId, [...tableData, newRow]);
              }}
            >
              + Add Row
            </Button>
          </div>
        );
      }

      default:
        return (
          <Input
            placeholder={`Enter value for ${control.label}`}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        );
    }
  };

  const renderControlSection = (controls: ControlInstance[], sectionName: string) => (
    <Box key={sectionName} className={styles.section}>
      <Text size="4" weight="medium" className={styles.sectionTitle}>
        {sectionName}
      </Text>
      {controls.map((control) => (
        <Box key={control.id} className={styles.field}>
          <Text size="3" weight="medium" className={styles.fieldLabel}>
            {control.label}
            {Boolean((control.config as Record<string, unknown>)?.required) && (
              <span className={styles.required}>*</span>
            )}
          </Text>
          {renderControlInput(control)}
        </Box>
      ))}
    </Box>
  );

  if (!component || !componentInstance) return null;

  // Organize controls by sections or show legacy controls
  const sections = component.sections || [];
  const legacyControls = component.controls || [];

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Edit ${component?.name || 'Component'} Content`}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <Text size="5" weight="bold">
            Edit {component.name} Content
          </Text>
          <Button variant="ghost" onClick={handleClose}>
            ×
          </Button>
        </div>

        <div className={styles.content}>
          {sections.length > 0
            ? // Render sectioned controls
              sections.map((section) => renderControlSection(section.controls, section.name))
            : // Render legacy controls
              renderControlSection(legacyControls, 'Fields')}

          {sections.length === 0 && legacyControls.length === 0 && (
            <div className={styles.emptyState}>
              <Text color="gray">This component has no fields defined yet.</Text>
              <Text size="2" color="gray">
                Go to Components page to add fields to this component.
              </Text>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Content'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
