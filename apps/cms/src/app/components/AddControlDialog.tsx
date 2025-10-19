'use client';

import { Box, Flex, Grid, Text } from '@radix-ui/themes';
import { Button, CONTROL_METADATA, ControlType, Input, Modal } from '@repo/ui';
import { ChangeEvent, useEffect, useState } from 'react';
import { AddControlDialogProps, ConfigStep } from './AddControlDialog.model';
import {
  BUILT_IN_CONTROLS,
  ControlDefinition,
  EnumerationConfig,
  ImageConfig,
  JsonConfig,
  RichTextConfig,
  TableConfig,
  TextBoxConfig,
} from './controls';

export const AddControlDialog = ({
  open,
  onOpenChange,
  onAddControl,
  initialControl = null,
  mode = 'add',
}: AddControlDialogProps) => {
  const [step, setStep] = useState<ConfigStep>(mode === 'edit' ? 'configure' : 'select');
  const [selectedControl, setSelectedControl] = useState<ControlDefinition | null>(null);

  // Common form state
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);

  // TextBox specific config
  const [multiline, setMultiline] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);

  // Enumeration specific config
  const [enumOptions, setEnumOptions] = useState(''); // Multiline string input

  // Image specific config
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['jpg', 'png', 'gif']);
  const [maxSize, setMaxSize] = useState<number | undefined>(undefined);

  // Rich Text specific config
  const [toolbar, setToolbar] = useState<string[]>(['bold', 'italic', 'link']);

  // JSON specific config
  const [schema, setSchema] = useState<string>('');
  const [pretty, setPretty] = useState(false);

  // Table specific config
  const [tableCaption, setTableCaption] = useState('');
  const [tableFootnote, setTableFootnote] = useState('');
  const [tableHeaders, setTableHeaders] = useState<
    Array<{ id: string; label: string; type?: 'text' | 'number' | 'date' }>
  >([{ id: 'header1', label: 'Column 1', type: 'text' }]);

  // Helper function to transform multiline options into label/value pairs
  const transformEnumOptions = (optionsText: string): Array<{ label: string; value: string }> => {
    return optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({
        label: line,
        value: line.toUpperCase().replace(/\s+/g, '_'),
      }));
  };

  // Initialize form with existing values when editing
  useEffect(() => {
    if (mode === 'edit' && initialControl) {
      const config = initialControl.config as Record<string, unknown>;

      // Common fields
      setLabel((config.label as string) || '');
      setRequired((config.required as boolean) || false);

      // Control type specific initialization
      switch (initialControl.controlType) {
        case ControlType.TEXT: {
          const textConfig = config as TextBoxConfig;
          setMultiline(textConfig.multiline || false);
          setPlaceholder(textConfig.placeholder || '');
          setMaxLength(textConfig.maxLength);
          break;
        }
        case ControlType.ENUMERATION: {
          const enumConfig = config as EnumerationConfig;
          // Convert options back to multiline string for editing
          const optionsText = enumConfig.options?.map((opt) => opt.label).join('\n') || '';
          setEnumOptions(optionsText);
          setPlaceholder(enumConfig.placeholder || '');
          break;
        }
        case ControlType.MEDIA: {
          const imageConfig = config as ImageConfig;
          setAllowedTypes(imageConfig.allowedTypes || ['jpg', 'png', 'gif']);
          setMaxSize(imageConfig.maxSize);
          break;
        }
        case ControlType.RICHTEXT: {
          const richConfig = config as RichTextConfig;
          setToolbar(richConfig.toolbar || ['bold', 'italic', 'link']);
          setMaxLength(richConfig.maxLength);
          break;
        }
        case ControlType.JSON: {
          const jsonConfig = config as JsonConfig;
          setSchema(jsonConfig.schema ? JSON.stringify(jsonConfig.schema, null, 2) : '');
          setPretty(jsonConfig.pretty || false);
          break;
        }
        case ControlType.TABLE: {
          const tableConfig = config as TableConfig;
          setTableCaption(tableConfig.caption || '');
          setTableFootnote(tableConfig.footnote || '');
          setTableHeaders(tableConfig.headers || [{ id: 'header1', label: 'Column 1', type: 'text' }]);
          break;
        }
      }

      // Set the selected control for editing
      const controlDef = BUILT_IN_CONTROLS.find((c) => c.controlType === initialControl.controlType);
      setSelectedControl(controlDef || null);
      setStep('configure'); // Ensure we're on the configure step for editing
    } else if (mode === 'add') {
      // Reset to select step for adding new controls
      setStep('select');
    }
  }, [mode, initialControl, open]); // Add 'open' to dependencies

  const handleControlSelect = (control: ControlDefinition) => {
    setSelectedControl(control);
    // All controls are configurable, so move to configure step
    setStep('configure');
  };

  const handleAddTextBox = () => {
    if (!label.trim()) return;

    const config: TextBoxConfig = {
      label: label.trim(),
      multiline,
      placeholder: placeholder.trim() || undefined,
      required,
      maxLength,
    };

    onAddControl(ControlType.TEXT, config);
    handleClose();
  };

  const handleAddEnumeration = () => {
    if (!label.trim() || !enumOptions.trim()) return;

    const transformedOptions = transformEnumOptions(enumOptions);
    if (transformedOptions.length === 0) return;

    const config: EnumerationConfig = {
      label: label.trim(),
      options: transformedOptions,
      placeholder: placeholder.trim() || undefined,
      required,
    };

    onAddControl(ControlType.ENUMERATION, config);
    handleClose();
  };

  const handleAddImage = () => {
    if (!label.trim()) return;

    const config: ImageConfig = {
      label: label.trim(),
      allowedTypes: allowedTypes.filter((type) => type.trim()),
      maxSize,
      required,
    };

    onAddControl(ControlType.MEDIA, config);
    handleClose();
  };

  const handleAddRichText = () => {
    if (!label.trim()) return;

    const config: RichTextConfig = {
      label: label.trim(),
      toolbar: toolbar.filter((tool) => tool.trim()),
      maxLength,
      required,
    };

    onAddControl(ControlType.RICHTEXT, config);
    handleClose();
  };

  const handleAddJson = () => {
    if (!label.trim()) return;

    let parsedSchema: Record<string, unknown> | undefined;
    if (schema.trim()) {
      try {
        parsedSchema = JSON.parse(schema.trim());
      } catch {
        // Invalid JSON schema, could show an error here
        return;
      }
    }

    const config: JsonConfig = {
      label: label.trim(),
      schema: parsedSchema,
      pretty,
      required,
    };

    onAddControl(ControlType.JSON, config);
    handleClose();
  };

  const handleAddTable = () => {
    if (!label.trim() || tableHeaders.length === 0) return;

    const config: TableConfig = {
      label: label.trim(),
      caption: tableCaption.trim() || undefined,
      footnote: tableFootnote.trim() || undefined,
      headers: tableHeaders,
      required,
    };

    onAddControl(ControlType.TABLE, config);
    handleClose();
  };

  const handleClose = () => {
    // Reset step based on mode
    if (mode === 'edit') {
      setStep('configure');
    } else {
      setStep('select');
    }

    setSelectedControl(null);

    // Reset all form state
    setLabel('');
    setRequired(false);
    setMultiline(false);
    setPlaceholder('');
    setMaxLength(undefined);
    setEnumOptions('');
    setAllowedTypes(['jpg', 'png', 'gif']);
    setMaxSize(undefined);
    setToolbar(['bold', 'italic', 'link']);
    setSchema('');
    setPretty(false);
    setTableCaption('');
    setTableFootnote('');
    setTableHeaders([{ id: 'header1', label: 'Column 1', type: 'text' }]);

    onOpenChange(false);
  };

  const renderSelectStep = () => (
    <Box>
      <Text size="3" weight="bold" style={{ marginBottom: '16px' }}>
        Select a Control Type
      </Text>
      <Grid columns="1" gap="3">
        {BUILT_IN_CONTROLS.map((control) => (
          <Box
            key={control.controlType}
            onClick={() => handleControlSelect(control)}
            style={{
              padding: '12px',
              border: '1px solid var(--gray-6)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--violet-8)';
              e.currentTarget.style.backgroundColor = 'var(--violet-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-6)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Flex align="center" gap="3">
              <Text size="4">{control.icon}</Text>
              <Box>
                <Text size="3" weight="bold">
                  {CONTROL_METADATA[control.controlType].displayName}
                </Text>
                <Text size="2" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                  {control.description}
                </Text>
              </Box>
            </Flex>
          </Box>
        ))}
      </Grid>
    </Box>
  );

  const renderConfigureStep = () => {
    if (!selectedControl) return null;

    const renderControlSpecificConfig = () => {
      switch (selectedControl.controlType) {
        case ControlType.TEXT:
          return (
            <>
              <Box style={{ marginBottom: '16px' }}>
                <Input
                  label="Placeholder (Optional)"
                  value={placeholder}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPlaceholder(e.target.value)}
                  placeholder="Enter placeholder text"
                />
              </Box>

              <Flex gap="4" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={multiline} onChange={(e) => setMultiline(e.target.checked)} />
                  <Text size="2">Multi-line (Textarea)</Text>
                </label>
              </Flex>

              <Box style={{ marginBottom: '16px' }}>
                <Input
                  label="Max Length (Optional)"
                  type="number"
                  value={maxLength?.toString() || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="Maximum number of characters"
                />
              </Box>
            </>
          );

        case ControlType.ENUMERATION:
          return (
            <>
              <Box style={{ marginBottom: '16px' }}>
                <Input
                  label="Placeholder (Optional)"
                  value={placeholder}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPlaceholder(e.target.value)}
                  placeholder="Select an option..."
                />
              </Box>

              <Box style={{ marginBottom: '16px' }}>
                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  Options (one per line)
                </Text>
                <textarea
                  value={enumOptions}
                  onChange={(e) => setEnumOptions(e.target.value)}
                  placeholder={`Option 1\nOption 2\nOption 3`}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '8px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
                <Text size="1" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                  Labels will be displayed as entered. Values will be auto-generated (UPPERCASE_WITH_UNDERSCORES).
                </Text>
              </Box>
            </>
          );

        case ControlType.MEDIA:
          return (
            <>
              <Box style={{ marginBottom: '16px' }}>
                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  Allowed File Types
                </Text>
                <Flex gap="2" wrap="wrap">
                  {['jpg', 'png', 'gif', 'webp', 'svg'].map((type) => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={allowedTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAllowedTypes([...allowedTypes, type]);
                          } else {
                            setAllowedTypes(allowedTypes.filter((t) => t !== type));
                          }
                        }}
                      />
                      <Text size="2">{type.toUpperCase()}</Text>
                    </label>
                  ))}
                </Flex>
              </Box>

              <Box style={{ marginBottom: '16px' }}>
                <Input
                  label="Max File Size (MB)"
                  type="number"
                  value={maxSize?.toString() || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setMaxSize(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="Maximum file size in MB"
                />
              </Box>
            </>
          );

        case ControlType.RICHTEXT:
          return (
            <>
              <Box style={{ marginBottom: '16px' }}>
                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  Toolbar Options
                </Text>
                <Flex gap="2" wrap="wrap">
                  {['bold', 'italic', 'underline', 'link', 'bulletList', 'numberedList', 'blockquote'].map((tool) => (
                    <label key={tool} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="checkbox"
                        checked={toolbar.includes(tool)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setToolbar([...toolbar, tool]);
                          } else {
                            setToolbar(toolbar.filter((t) => t !== tool));
                          }
                        }}
                      />
                      <Text size="2">{tool}</Text>
                    </label>
                  ))}
                </Flex>
              </Box>

              <Box style={{ marginBottom: '16px' }}>
                <Input
                  label="Max Length (Optional)"
                  type="number"
                  value={maxLength?.toString() || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="Maximum number of characters"
                />
              </Box>
            </>
          );

        case ControlType.JSON:
          return (
            <>
              <Box style={{ marginBottom: '16px' }}>
                <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
                  JSON Schema (Optional)
                </Text>
                <textarea
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  placeholder="Enter JSON schema for validation"
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '8px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
              </Box>

              <Flex gap="4" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} />
                  <Text size="2">Pretty print JSON</Text>
                </label>
              </Flex>
            </>
          );

        case ControlType.TABLE:
          return (
            <>
              <Box style={{ marginBottom: '16px' }}>
                <Text size="2" style={{ marginBottom: '8px' }}>
                  Table Caption (Optional)
                </Text>
                <Input
                  value={tableCaption}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTableCaption(e.target.value)}
                  placeholder="Enter table caption"
                  style={{ width: '100%' }}
                />
              </Box>

              <Box style={{ marginBottom: '16px' }}>
                <Text size="2" style={{ marginBottom: '8px' }}>
                  Table Footnote (Optional)
                </Text>
                <Input
                  value={tableFootnote}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTableFootnote(e.target.value)}
                  placeholder="Enter table footnote"
                  style={{ width: '100%' }}
                />
              </Box>

              <Box style={{ marginBottom: '16px' }}>
                <Flex align="center" justify="between" style={{ marginBottom: '8px' }}>
                  <Text size="2">Table Headers</Text>
                  <Button
                    size="1"
                    onClick={() => {
                      const newHeader = {
                        id: `header-${tableHeaders.length + 1}`,
                        label: `Column ${tableHeaders.length + 1}`,
                        type: 'text' as const,
                      };
                      setTableHeaders([...tableHeaders, newHeader]);
                    }}
                  >
                    Add Header
                  </Button>
                </Flex>

                {tableHeaders.map((header, index) => (
                  <Box
                    key={header.id}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      border: '1px solid var(--gray-6)',
                      borderRadius: '4px',
                    }}
                  >
                    <Flex gap="2" align="center" style={{ marginBottom: '8px' }}>
                      <Box style={{ flex: 1 }}>
                        <Text size="1" style={{ marginBottom: '4px' }}>
                          Header Label
                        </Text>
                        <Input
                          value={header.label}
                          onChange={(e) => {
                            const updated = [...tableHeaders];
                            updated[index] = { ...header, label: e.target.value };
                            setTableHeaders(updated);
                          }}
                          placeholder="Enter header label"
                          style={{ width: '100%' }}
                        />
                      </Box>
                      <Box>
                        <Text size="1" style={{ marginBottom: '4px' }}>
                          Type
                        </Text>
                        <select
                          value={header.type || 'text'}
                          onChange={(e) => {
                            const updated = [...tableHeaders];
                            updated[index] = { ...header, type: e.target.value as 'text' | 'number' | 'date' };
                            setTableHeaders(updated);
                          }}
                          style={{ padding: '4px', border: '1px solid var(--gray-6)', borderRadius: '4px' }}
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Multiline</option>
                        </select>
                      </Box>
                      {tableHeaders.length > 1 && (
                        <Button
                          size="1"
                          color="red"
                          onClick={() => {
                            const updated = tableHeaders.filter((_, i) => i !== index);
                            setTableHeaders(updated);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </Flex>
                  </Box>
                ))}
              </Box>
            </>
          );

        default:
          return null;
      }
    };

    const getSubmitHandler = () => {
      switch (selectedControl.controlType) {
        case ControlType.TEXT:
          return handleAddTextBox;
        case ControlType.ENUMERATION:
          return handleAddEnumeration;
        case ControlType.MEDIA:
          return handleAddImage;
        case ControlType.RICHTEXT:
          return handleAddRichText;
        case ControlType.JSON:
          return handleAddJson;
        case ControlType.TABLE:
          return handleAddTable;
        default:
          return () => {};
      }
    };

    const isFormValid = () => {
      if (!label.trim()) return false;

      switch (selectedControl.controlType) {
        case ControlType.ENUMERATION:
          return enumOptions.trim().length > 0 && enumOptions.split('\n').some((line) => line.trim().length > 0);
        case ControlType.MEDIA:
          return allowedTypes.length > 0;
        case ControlType.JSON:
          if (schema.trim()) {
            try {
              JSON.parse(schema.trim());
              return true;
            } catch {
              return false;
            }
          }
          return true;
        case ControlType.TABLE:
          return tableHeaders.length > 0 && tableHeaders.every((header) => header.label.trim().length > 0);
        default:
          return true;
      }
    };

    return (
      <Box>
        <Flex align="center" gap="2" style={{ marginBottom: '16px' }}>
          {mode === 'add' ? (
            <Button variant="outline" size="1" onClick={() => setStep('select')}>
              ← Back
            </Button>
          ) : null}
          <Text size="3" weight="bold">
            Configure {CONTROL_METADATA[selectedControl.controlType].displayName}
          </Text>
        </Flex>

        <Box style={{ marginBottom: '16px' }}>
          <Input
            label="Label"
            value={label}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
            placeholder="Enter field label"
            required
          />
        </Box>

        {renderControlSpecificConfig()}

        <Flex gap="4" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            <Text size="2">Required field</Text>
          </label>
        </Flex>

        <Flex gap="3" justify="end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={getSubmitHandler()} disabled={!isFormValid()}>
            {mode === 'edit'
              ? `Update ${CONTROL_METADATA[selectedControl.controlType].displayName}`
              : `Add ${CONTROL_METADATA[selectedControl.controlType].displayName}`}
          </Button>
        </Flex>
      </Box>
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Edit Control' : 'Add Control'}>
      <Box style={{ minWidth: '400px' }}>{step === 'select' ? renderSelectStep() : renderConfigureStep()}</Box>
    </Modal>
  );
};
