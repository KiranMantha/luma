'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Box, Button, Input, Select, Tabs, Text, Textarea } from '../../atoms';
import { Card, Modal } from '../../molecules';
import { ControlType } from '../ComponentBuilder/ComponentPreview/ComponentPreview.model';
import type { ComponentSection, ControlInstance, RepeatableStructure } from '../ComponentBuilder/models';
import type { ComponentContentAuthoringProps } from './ComponentContentAuthoring.model';
import styles from './ComponentContentAuthoring.module.scss';

export const ComponentContentAuthoring = ({
  open,
  onOpenChange,
  componentInstance,
  component,
  template,
  onContentSaved,
  onSave,
}: ComponentContentAuthoringProps) => {
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Initialize content when component instance changes
  useEffect(() => {
    if (componentInstance && component) {
      setContent(componentInstance.config || {});

      // Set active tab to first section if sections exist
      if (component.sections && component.sections.length > 0) {
        setActiveTabId(component.sections[0].id);
      }
    }
  }, [componentInstance, component]);

  const handleRepeatableChange = (structureId: string, itemIndex: number, fieldId: string, value: unknown) => {
    setContent((prev) => {
      const existingStructure = (prev[structureId] as Record<string, unknown>[]) || [];
      const updatedStructure = [...existingStructure];

      // Ensure the item exists at the specified index
      while (updatedStructure.length <= itemIndex) {
        updatedStructure.push({});
      }

      // Update the specific field
      updatedStructure[itemIndex] = {
        ...updatedStructure[itemIndex],
        [fieldId]: value,
      };

      return {
        ...prev,
        [structureId]: updatedStructure,
      };
    });
  };

  const addRepeatableItem = (structureId: string) => {
    setContent((prev) => {
      const existingItems = (prev[structureId] as Record<string, unknown>[]) || [];
      return {
        ...prev,
        [structureId]: [...existingItems, {}],
      };
    });
  };

  const removeRepeatableItem = (structureId: string, itemIndex: number) => {
    setContent((prev) => {
      const existingItems = (prev[structureId] as Record<string, unknown>[]) || [];
      const updatedItems = existingItems.filter((_, index) => index !== itemIndex);
      return {
        ...prev,
        [structureId]: updatedItems,
      };
    });
  };

  // Helper function to migrate content when component structure changes
  const migrateRepeatableStructureContent = (
    oldContent: Record<string, unknown>,
    structure: RepeatableStructure,
  ): Record<string, unknown>[] => {
    const existingItems = (oldContent[structure.id] as Record<string, unknown>[]) || [];

    return existingItems.map((item) => {
      const migratedItem: Record<string, unknown> = {};

      // Preserve values for fields that still exist (by ID)
      structure.fields.forEach((field) => {
        if (item[field.id] !== undefined) {
          migratedItem[field.id] = item[field.id];
        }
      });

      // If no exact ID matches found, try order-based migration
      if (Object.keys(migratedItem).length === 0) {
        const itemValues = Object.values(item);
        structure.fields.forEach((field, index) => {
          if (itemValues[index] !== undefined) {
            migratedItem[field.id] = itemValues[index];
          }
        });
      }

      return migratedItem;
    });
  };

  const handleApplyChanges = async () => {
    if (!componentInstance) return;

    try {
      // Save directly to the database via the template API endpoint
      if (template) {
        const response = await fetch(
          `http://localhost:3002/api/templates/${template.id}/instances/${componentInstance.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
          },
        );

        if (!response.ok) {
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
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    }
  };

  const renderControl = (control: ControlInstance, sectionId?: string) => {
    const currentValue = sectionId
      ? (content[sectionId] as Record<string, unknown>)?.[control.id]
      : content[control.id];

    const handleChange = (value: unknown) => {
      if (sectionId) {
        setContent((prev) => ({
          ...prev,
          [sectionId]: {
            ...((prev[sectionId] as Record<string, unknown>) || {}),
            [control.id]: value,
          },
        }));
      } else {
        setContent((prev) => ({
          ...prev,
          [control.id]: value,
        }));
      }
    };

    const config = control.config || {};

    switch (control.controlType) {
      case ControlType.TEXT: {
        const textConfig = config as { placeholder?: string; maxLength?: number };
        const placeholder = textConfig.placeholder || `Enter ${control.label || 'text'}`;
        const maxLength = textConfig.maxLength;
        return (
          <Input
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
            maxLength={maxLength}
          />
        );
      }

      case ControlType.RICHTEXT: {
        const richtextConfig = config as { placeholder?: string; maxLength?: number };
        const placeholder = richtextConfig.placeholder || `Enter ${control.label || 'rich text content'}`;
        const maxLength = richtextConfig.maxLength;
        return (
          <Textarea
            placeholder={placeholder}
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            maxLength={maxLength}
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
            {currentValue ? (
              <div className={styles.mediaPreview}>
                <Image
                  src={currentValue as string}
                  alt="Preview"
                  className={styles.previewImage}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  width={200}
                  height={120}
                />
              </div>
            ) : null}
          </div>
        );
      }

      case ControlType.JSON: {
        const jsonConfig = config as { placeholder?: string };
        const placeholder = jsonConfig.placeholder || `Enter JSON data for ${control.label || 'this field'}`;
        return (
          <Textarea
            placeholder={placeholder}
            value={currentValue ? JSON.stringify(currentValue, null, 2) : ''}
            onChange={(e) => {
              try {
                const jsonValue = e.target.value ? JSON.parse(e.target.value) : null;
                handleChange(jsonValue);
              } catch (error) {
                // Keep the raw text for editing, but don't update the content yet
                console.log('JSON parsing error:', error);
              }
            }}
            rows={6}
          />
        );
      }

      case ControlType.TABLE: {
        const tableConfig = config as { columns?: string[]; placeholder?: string };
        const columns = tableConfig.columns || ['Column 1', 'Column 2'];
        const tableData = (currentValue as string[][]) || [];
        return (
          <div className={styles.tableInput}>
            <div className={styles.tableControls}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newRow = columns.map(() => '');
                  handleChange([...tableData, newRow]);
                }}
              >
                Add Row
              </Button>
            </div>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                {columns.map((col, index) => (
                  <div key={index} className={styles.tableCell}>
                    <Text size="2" weight="medium">
                      {col}
                    </Text>
                  </div>
                ))}
                <div className={styles.tableCell}>
                  <Text size="2" weight="medium">
                    Actions
                  </Text>
                </div>
              </div>
              {tableData.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.tableRow}>
                  {columns.map((_, colIndex) => (
                    <div key={colIndex} className={styles.tableCell}>
                      <Input
                        value={row[colIndex] || ''}
                        onChange={(e) => {
                          const newTableData = [...tableData];
                          if (newTableData[rowIndex]) {
                            newTableData[rowIndex][colIndex] = e.target.value;
                            handleChange(newTableData);
                          }
                        }}
                        placeholder={`Enter ${columns[colIndex]}`}
                      />
                    </div>
                  ))}
                  <div className={styles.tableCell}>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="red"
                      onClick={() => {
                        const newTableData = tableData.filter((_, index) => index !== rowIndex);
                        handleChange(newTableData);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return (
          <Input
            placeholder={`Enter ${control.label || 'value'}`}
            value={currentValue as string}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  const renderRepeatableStructure = (structure: RepeatableStructure) => {
    const items = (content[structure.id] as Record<string, unknown>[]) || [];
    const migratedItems = migrateRepeatableStructureContent(content, structure);

    // Update content with migrated items if needed
    if (JSON.stringify(items) !== JSON.stringify(migratedItems)) {
      setContent((prev) => ({
        ...prev,
        [structure.id]: migratedItems,
      }));
    }

    return (
      <Card className={styles.repeatableStructure}>
        <div className={styles.repeatableHeader}>
          <Text size="3" weight="medium">
            {structure.name}
          </Text>
          {structure.description && (
            <Text size="2" color="gray">
              {structure.description}
            </Text>
          )}
          <Button size="sm" variant="ghost" onClick={() => addRepeatableItem(structure.id)}>
            Add {structure.name}
          </Button>
        </div>

        {migratedItems.length === 0 ? (
          <div className={styles.emptyRepeatable}>
            <Text size="2" color="gray">
              No {structure.name.toLowerCase()} items yet. Click &quot;Add {structure.name}&quot; to create one.
            </Text>
          </div>
        ) : (
          <div className={styles.repeatableItems}>
            {migratedItems.map((item, itemIndex) => (
              <Card key={itemIndex} className={styles.repeatableItem}>
                <div className={styles.repeatableItemHeader}>
                  <Text size="2" weight="medium">
                    {structure.name} #{itemIndex + 1}
                  </Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="red"
                    onClick={() => removeRepeatableItem(structure.id, itemIndex)}
                  >
                    Remove
                  </Button>
                </div>
                <div className={styles.repeatableItemFields}>
                  {structure.fields.map((field) => {
                    const fieldValue = item[field.id];
                    return (
                      <div key={field.id} className={styles.field}>
                        <label className={styles.fieldLabel}>
                          {field.label || `Field ${field.id}`}
                          {(field.config as { required?: boolean })?.required && (
                            <span className={styles.required}>*</span>
                          )}
                        </label>
                        <div>
                          {(() => {
                            const handleFieldChange = (value: unknown) => {
                              handleRepeatableChange(structure.id, itemIndex, field.id, value);
                            };

                            const config = field.config || {};

                            switch (field.controlType) {
                              case ControlType.TEXT: {
                                const textConfig = config as { placeholder?: string; maxLength?: number };
                                const placeholder = textConfig.placeholder || `Enter ${field.label || 'text'}`;
                                const maxLength = textConfig.maxLength;
                                return (
                                  <Input
                                    placeholder={placeholder}
                                    value={(fieldValue as string) || ''}
                                    onChange={(e) => handleFieldChange(e.target.value)}
                                    maxLength={maxLength}
                                  />
                                );
                              }

                              case ControlType.RICHTEXT: {
                                const richtextConfig = config as { placeholder?: string; maxLength?: number };
                                const placeholder =
                                  richtextConfig.placeholder || `Enter ${field.label || 'rich text content'}`;
                                const maxLength = richtextConfig.maxLength;
                                return (
                                  <Textarea
                                    placeholder={placeholder}
                                    value={(fieldValue as string) || ''}
                                    onChange={(e) => handleFieldChange(e.target.value)}
                                    rows={3}
                                    maxLength={maxLength}
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
                                    value={(fieldValue as string) || ''}
                                    onChange={(e) => handleFieldChange(e.target.value)}
                                  />
                                );
                              }

                              case ControlType.MEDIA: {
                                const mediaConfig = config as { placeholder?: string };
                                const placeholder =
                                  mediaConfig.placeholder || `Enter image URL for ${field.label || 'this field'}`;
                                return (
                                  <div className={styles.mediaInput}>
                                    <Input
                                      placeholder={placeholder}
                                      value={(fieldValue as string) || ''}
                                      onChange={(e) => handleFieldChange(e.target.value)}
                                    />
                                    {fieldValue ? (
                                      <div className={styles.mediaPreview}>
                                        <Image
                                          src={fieldValue as string}
                                          alt="Preview"
                                          className={styles.previewImage}
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                          width={100}
                                          height={60}
                                        />
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              }

                              default:
                                return (
                                  <Input
                                    placeholder={`Enter ${field.label || 'value'}`}
                                    value={(fieldValue as string) || ''}
                                    onChange={(e) => handleFieldChange(e.target.value)}
                                  />
                                );
                            }
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const renderSectionContent = (section: ComponentSection) => (
    <div className={styles.section}>
      <Text size="4" weight="medium" className={styles.sectionTitle}>
        {section.name}
      </Text>

      {/* Regular Controls */}
      {section.controls && section.controls.length > 0 && (
        <div className={styles.controls}>
          {section.controls.map((control) => (
            <div key={control.id} className={styles.field}>
              <label className={styles.fieldLabel}>
                {control.label || `Control ${control.id}`}
                {(control.config as { required?: boolean })?.required && <span className={styles.required}>*</span>}
              </label>
              {renderControl(control, section.id)}
            </div>
          ))}
        </div>
      )}

      {/* Repeatable Structures */}
      {section.repeatableStructures && section.repeatableStructures.length > 0 && (
        <div className={styles.repeatableStructures}>
          {section.repeatableStructures.map((structure) => (
            <div key={structure.id}>{renderRepeatableStructure(structure)}</div>
          ))}
        </div>
      )}

      {(!section.controls || section.controls.length === 0) &&
        (!section.repeatableStructures || section.repeatableStructures.length === 0) && (
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
  const tabs = sections.map((section: ComponentSection) => {
    const controlsCount = (section.controls || []).length;
    const structuresCount = (section.repeatableStructures || []).length;
    const totalCount = controlsCount + structuresCount;

    return {
      id: section.id,
      label: `${section.name} (${totalCount})`,
      content: renderSectionContent(section),
    };
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg" title="Edit Component Content">
      <Box className={styles.authoring}>
        <div className={styles.header}>
          <Text size="5" weight="bold">
            Edit Content: {component.name}
          </Text>
          <Text size="2" color="gray">
            Configure the content for this component instance
          </Text>
        </div>

        <div className={styles.content}>
          {sections.length === 0 ? (
            <div className={styles.emptyControls}>
              <Text size="4" color="gray">
                This component doesn&apos;t have any sections configured yet.
              </Text>
              <Text size="2" color="gray">
                Go to the Component Builder to add sections and controls.
              </Text>
            </div>
          ) : (
            <Tabs tabs={tabs} activeTab={activeTabId || undefined} onTabChange={(tabId) => setActiveTabId(tabId)} />
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApplyChanges}>
            Apply Changes
          </Button>
        </div>
      </Box>
    </Modal>
  );
};
