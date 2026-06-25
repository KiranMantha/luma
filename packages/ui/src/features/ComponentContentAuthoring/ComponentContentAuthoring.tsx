'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Select, Tabs, Text, Textarea } from '../../atoms';
import { Card, Modal } from '../../molecules';
import { Component, ComponentSection, ControlInstance, ControlType, Fieldset } from '../ComponentBuilder';
import { ComponentContentAuthoringProps } from './ComponentContentAuthoring.model';
import styles from './ComponentContentAuthoring.module.scss';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;

export const ComponentContentAuthoring = ({
  open,
  onOpenChange,
  componentInstance,
  component,
  template,
  page,
  onContentSaved,
  onSave,
}: ComponentContentAuthoringProps) => {
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  // Helper function to migrate old field references to new field names
  const migrateRepeatableStructureContent = (
    instanceConfig: Record<string, unknown>,
    component: Component,
  ): Record<string, unknown> => {
    if (!component.sections) return instanceConfig;

    const migratedConfig = { ...instanceConfig };

    component.sections.forEach((section) => {
      section.fieldsets?.forEach((fieldset) => {
        const structureContent = instanceConfig[fieldset.name] as unknown[];
        if (Array.isArray(structureContent) && structureContent.length > 0 && fieldset.fields) {
          // Migrate each item in the repeatable structure
          const migratedItems = structureContent.map((item) => {
            if (typeof item === 'object' && item !== null) {
              const itemObj = item as Record<string, unknown>;
              const migratedItem: Record<string, unknown> = {};

              const itemKeys = Object.keys(itemObj);
              const currentFieldIds = fieldset.fields?.map((field) => field.id) || [];

              // Check if any of the current field IDs exist in the item
              const hasCurrentFields = itemKeys.some((key) => currentFieldIds.includes(key));

              if (!hasCurrentFields && itemKeys.length > 0 && fieldset.fields.length > 0) {
                // Migrate old field references to new ones by mapping values in order
                console.log('AUTHORING MIGRATION: Migrating old field references to new structure');

                const oldValues = Object.values(itemObj);
                const newFields = fieldset.fields;

                // Map old values to new field IDs in order (up to the number of available fields)
                for (let i = 0; i < Math.min(oldValues.length, newFields.length); i++) {
                  const value = oldValues[i];
                  const newField = newFields[i];

                  if (newField?.id && value !== undefined) {
                    console.log(`AUTHORING MIGRATION: Mapping value ${i} to field ${newField.id}:`, value);
                    migratedItem[newField.id] = value;
                  }
                }

                return migratedItem;
              } else {
                // Keep existing mapping if field IDs are current
                return item;
              }
            }
            return item;
          });

          migratedConfig[fieldset.name] = migratedItems;
        }
      });
    });

    return migratedConfig;
  };

  // Initialize content from component instance config when modal opens
  useEffect(() => {
    if (open && componentInstance && component) {
      const originalConfig = componentInstance.config || {};
      const migratedConfig = migrateRepeatableStructureContent(originalConfig, component);
      setContent(migratedConfig);
    }
  }, [open, componentInstance, component]);

  const handleSave = async () => {
    if (!componentInstance) return;

    setLoading(true);
    try {
      // Save directly to the database via the appropriate API endpoint
      if (template) {
        const response = await fetch(`${API_BASE}/api/templates/${template.id}/instances/${componentInstance.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save content: ${response.statusText}`);
        }

        console.log('Content saved successfully to database');
      } else if (page) {
        const response = await fetch(`${API_BASE}/api/pages/${page.id}/instances/${componentInstance.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404 && errorData.error?.includes('save the page first')) {
            throw new Error('Please save the page first before editing component content.');
          }
          throw new Error(`Failed to save content: ${response.statusText}`);
        }

        console.log('Content saved successfully to database');
      }

      // Call the appropriate callback
      if (onContentSaved) {
        onContentSaved(componentInstance.id, content);
      } else if (onSave) {
        onSave(componentInstance.id, content);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save component content:', error);
      alert(`Failed to save content: ${error instanceof Error ? error.message : error}`);
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

  const handleRepeatableAdd = (structureName: string) => {
    const structureContent = (content[structureName] as unknown[]) || [];
    const newItem = {}; // Empty object for new instance
    setContent((prev) => ({
      ...prev,
      [structureName]: [...structureContent, newItem],
    }));
  };

  const handleRepeatableRemove = (structureName: string, index: number) => {
    const structureContent = (content[structureName] as unknown[]) || [];
    const newContent = structureContent.filter((_, i) => i !== index);
    setContent((prev) => ({
      ...prev,
      [structureName]: newContent,
    }));
  };

  const handleFieldsetFieldChange = (fieldsetName: string, index: number, fieldId: string, value: unknown) => {
    const structureContent = (content[fieldsetName] as Record<string, unknown>[]) || [];
    const updatedContent = [...structureContent];

    if (!updatedContent[index]) {
      updatedContent[index] = {};
    }

    updatedContent[index] = {
      ...updatedContent[index],
      [fieldId]: value,
    };

    setContent((prev) => ({
      ...prev,
      [fieldsetName]: updatedContent,
    }));
  };

  const renderControlInput = (control: ControlInstance, fieldsetName?: string, itemIndex?: number) => {
    const fieldId = control.id;

    // Handle field value based on context (regular field vs repeatable structure field)
    let currentValue;
    if (fieldsetName !== undefined && itemIndex !== undefined) {
      const fieldsetContent = (content[fieldsetName] as Record<string, unknown>[]) || [];
      currentValue = (fieldsetContent[itemIndex] && fieldsetContent[itemIndex][fieldId]) || '';
    } else {
      currentValue = content[fieldId] || '';
    }

    const config = control.config || {};

    // Create change handler based on context
    const handleChange = (value: unknown) => {
      if (fieldsetName !== undefined && itemIndex !== undefined) {
        handleFieldsetFieldChange(fieldsetName, itemIndex, fieldId, value);
      } else {
        handleFieldChange(fieldId, value);
      }
    };

    switch (control.controlType) {
      case ControlType.TEXT: {
        const textConfig = config as { multiline?: boolean; placeholder?: string; maxLength?: number };
        const placeholder = textConfig.placeholder || `Enter ${control.label || 'value'}`;
        return textConfig.multiline ? (
          <Textarea
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={textConfig.maxLength}
          />
        );
      }

      case ControlType.ENUMERATION: {
        const enumConfig = config as { options?: Array<{ label: string; value: string }> };
        const options = enumConfig.options || [];
        const selectOptions = [
          { value: '', label: 'Select an option...' },
          ...options.map((option) => ({ value: option.value, label: option.label })),
        ];
        return (
          <Select
            options={selectOptions}
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
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
              onChange={(e) => handleChange(e.target.value)}
            />
            {currentValue && (
              <div className={styles.mediaPreview}>
                <Image
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
            onChange={(e) => handleChange(e.target.value)}
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
                handleChange(parsed);
              } catch {
                handleChange(e.target.value);
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
                            handleChange(newTableData);
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
                handleChange([...tableData, newRow]);
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
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      }
    }
  };

  const renderFieldsets = (fieldset: Fieldset) => {
    // Get existing instances of this repeatable structure (stored as an array in content)
    // For example: content['Submenu'] = [{ title: 'Home', url: '/' }, { title: 'About', url: '/about' }]
    const structureContent = (content[fieldset.name] as Record<string, unknown>[]) || [];

    return (
      <div className={styles.repeatableStructure}>
        <div>
          <Text size="3" weight="medium" className={styles.fieldLabel}>
            {fieldset.name}
          </Text>
          {fieldset.description && (
            <Text size="2" color="gray">
              {fieldset.description}
            </Text>
          )}
        </div>
        <Card className={styles.structureCard}>
          <div className={styles.structureInstances}>
            {structureContent.length === 0 ? (
              <div className={styles.emptyStructure}>
                <Text size="2" color="gray">
                  No {fieldset.name.toLowerCase()} items yet. Click &quot;Add {fieldset.name}&quot; to create the first
                  one.
                </Text>
              </div>
            ) : (
              structureContent.map((_, index) => (
                <Card key={index} className={styles.structureInstance}>
                  <div className={styles.instanceFields}>
                    {fieldset.fields.map((field) => (
                      <Box key={field.id} className={styles.field}>
                        <Text size="3" weight="medium" className={styles.fieldLabel}>
                          {field.label || 'Unlabeled Field'}
                          {Boolean((field.config as Record<string, unknown>)?.required) && (
                            <span className={styles.required}>*</span>
                          )}
                        </Text>
                        <Flex align="center">
                          {renderControlInput(field, fieldset.name, index)}
                          <Button
                            size="sm"
                            variant="danger-outline"
                            onClick={() => handleRepeatableRemove(fieldset.name, index)}
                          >
                            Remove
                          </Button>
                        </Flex>
                      </Box>
                    ))}
                  </div>
                  <Box className="mt-4 text-right"></Box>
                </Card>
              ))
            )}
          </div>
          <Box className="mt-4 text-center">
            <Button size="md" variant="primary" onClick={() => handleRepeatableAdd(fieldset.name)}>
              + Add {fieldset.name}
            </Button>
          </Box>
        </Card>
      </div>
    );
  };

  const renderSectionContent = (section: ComponentSection) => (
    <div className={styles.sectionContent}>
      {/* Regular Controls */}
      {section.controls && section.controls.length > 0 && (
        <div className={styles.controlsList}>
          {section.controls.map((control) => (
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
      )}

      {/* Repeatable Structures */}
      {section.fieldsets && section.fieldsets.length > 0 && (
        <div className={styles.repeatableStructures}>
          {section.fieldsets.map((fieldset) => (
            <div key={fieldset.id}>{renderFieldsets(fieldset)}</div>
          ))}
        </div>
      )}

      {(!section.controls || section.controls.length === 0) &&
        (!section.fieldsets || section.fieldsets.length === 0) && (
          <div className={styles.emptyControls}>
            <Text size="3" color="gray">
              No content defined in this section yet.
            </Text>
          </div>
        )}
    </div>
  );

  if (!component || !componentInstance) return null;

  // All components now use sections
  const sections = component.sections || [];

  // Create tabs for the modal
  const tabs = sections.map((section) => {
    const controlsCount = (section.controls || []).length;
    const structuresCount = (section.fieldsets || []).length;
    const totalCount = controlsCount + structuresCount;

    return {
      id: section.id,
      label: `${section.name} (${totalCount})`,
      content: renderSectionContent(section),
    };
  });

  return (
    <Modal open={open} title={`Edit ${component?.name || 'Component'} Content`} size="xl" onOpenChange={onOpenChange}>
      <div className={styles.content}>
        {tabs.length > 0 ? (
          <div className={styles.tabsContainer}>
            <Tabs tabs={tabs} />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Text color="gray">This component has no sections defined yet.</Text>
            <Text size="2" color="gray">
              Go to Components page to add sections and fields to this component.
            </Text>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Applying...' : 'Apply Changes'}
        </Button>
      </div>
    </Modal>
  );
};
