'use client';

import type { Component, ComponentInstance, ControlInstance } from '@repo/ui';
import { Box, Button, ControlType, Input, Modal, Select, Tabs, Text, Textarea } from '@repo/ui';
import { useEffect, useState } from 'react';
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

  console.log(componentInstance);
  console.log(component);

  // Initialize content from component instance config when modal opens
  useEffect(() => {
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
        const placeholder = textConfig.placeholder || `Enter ${control.label || 'value'}`;
        return textConfig.multiline ? (
          <Textarea
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            maxLength={textConfig.maxLength}
          />
        );
      }

      case ControlType.ENUMERATION: {
        const enumConfig = config as { options?: string[] };
        const options = enumConfig.options || [];
        const selectOptions = [
          { value: '', label: 'Select an option...' },
          ...options.map((option) => ({ value: option, label: option })),
        ];
        return (
          <Select
            options={selectOptions}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        );
      }

      case ControlType.MEDIA: {
        const mediaConfig = config as { placeholder?: string };
        const placeholder = mediaConfig.placeholder || `Enter image URL for ${control.label || 'this field'}`;
        return (
          <div className={styles.mediaInput}>
            <Input
              placeholder={placeholder}
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
        const richtextConfig = config as { placeholder?: string };
        const placeholder =
          richtextConfig.placeholder || `Enter rich text content for ${control.label || 'this field'}`;
        return (
          <Textarea
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={6}
          />
        );
      }

      case ControlType.JSON: {
        const jsonConfig = config as { placeholder?: string };
        const placeholder = jsonConfig.placeholder || `Enter JSON data for ${control.label || 'this field'}`;
        return (
          <Textarea
            placeholder={placeholder}
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

      default: {
        const defaultConfig = config as { placeholder?: string };
        const placeholder = defaultConfig.placeholder || `Enter value for ${control.label || 'this field'}`;
        return (
          <Input
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
          />
        );
      }
    }
  };

  const renderSectionContent = (controls: ControlInstance[]) => (
    <div className={styles.sectionContent}>
      {controls.length > 0 ? (
        <div className={styles.controlsList}>
          {controls.map((control) => (
            <Box key={control.id} className={styles.field}>
              <Text size="3" weight="medium" className={styles.fieldLabel}>
                {control.label || 'Unlabeled Field'}
                {Boolean((control.config as Record<string, unknown>)?.required) && (
                  <span className={styles.required}>*</span>
                )}
              </Text>
              {renderControlInput(control)}
            </Box>
          ))}
        </div>
      ) : (
        <div className={styles.emptyControls}>
          <Text size="3" color="gray">
            No controls in this section yet.
          </Text>
        </div>
      )}
    </div>
  );

  if (!component || !componentInstance) return null;

  // Organize controls by sections or show legacy controls
  const sections = component.sections || [];
  const legacyControls = component.controls || [];

  // Create tabs for the modal
  const tabs =
    sections.length > 0
      ? sections.map((section) => ({
          id: section.id,
          label: `${section.name} (${section.controls.length})`,
          content: renderSectionContent(section.controls),
        }))
      : [
          {
            id: 'fields',
            label: `Fields (${legacyControls.length})`,
            content: renderSectionContent(legacyControls),
          },
        ];

  return (
    <Modal open={open} title={`Edit ${component?.name || 'Component'} Content`} size="xl" onOpenChange={onOpenChange}>
      <div className={styles.content}>
        {tabs.length > 0 && tabs[0] && tabs[0].content ? (
          <div className={styles.tabsContainer}>
            <Tabs tabs={tabs} />
          </div>
        ) : (
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
    </Modal>
  );
};
