'use client';

import { Box, Button, CONTROL_METADATA, ControlType, Flex, Grid, Modal, Text } from '@repo/ui';
import { useEffect, useState } from 'react';
import { AddControlDialogProps, ConfigStep } from './AddControlDialog.model';
import {
  ControlConfig,
  EnumerationConfig,
  EnumerationControlConfig,
  ImageConfig,
  ImageControlConfig,
  JsonConfig,
  JsonControlConfig,
  RichTextConfig,
  RichTextControlConfig,
  TableConfig,
  TableControlConfig,
  TextConfig,
  TextControlConfig,
} from './ControlConfigs';
import { BUILT_IN_CONTROLS, ControlDefinition } from './controls';

export const AddControlDialog = ({
  open,
  onOpenChange,
  onAddControl,
  initialControl = null,
  mode = 'add',
}: AddControlDialogProps) => {
  const [step, setStep] = useState<ConfigStep>(mode === 'edit' ? 'configure' : 'select');
  const [selectedControl, setSelectedControl] = useState<ControlDefinition | null>(null);
  const [config, setConfig] = useState<ControlConfig | null>(null);

  // Helper function to create default config for a control type
  const createDefaultConfig = (controlType: ControlType): ControlConfig => {
    const baseConfig = { label: '', required: false };

    switch (controlType) {
      case ControlType.TEXT:
        return { ...baseConfig, placeholder: '', multiline: false } as TextControlConfig;
      case ControlType.ENUMERATION:
        return { ...baseConfig, placeholder: 'Select an option...', options: [] } as EnumerationControlConfig;
      case ControlType.MEDIA:
        return { ...baseConfig, allowedTypes: ['jpg', 'png', 'gif', 'webp'], maxSize: 5 } as ImageControlConfig;
      case ControlType.RICHTEXT:
        return { ...baseConfig, toolbar: ['bold', 'italic', 'link'], maxLength: undefined } as RichTextControlConfig;
      case ControlType.JSON:
        return { ...baseConfig, schema: '', pretty: false } as JsonControlConfig;
      case ControlType.TABLE:
        return {
          ...baseConfig,
          title: '',
          caption: '',
          footnote: '',
          headers: [{ id: 'header1', label: 'Column 1', type: 'text' }],
        } as TableControlConfig;
      default:
        return { ...baseConfig, placeholder: '', multiline: false } as TextControlConfig;
    }
  };

  // Helper function to transform config to legacy format for backward compatibility
  const transformConfigToLegacy = (controlType: ControlType, config: ControlConfig): unknown => {
    switch (controlType) {
      case ControlType.TEXT: {
        const textConfig = config as TextControlConfig;
        return {
          label: textConfig.label,
          required: textConfig.required,
          placeholder: textConfig.placeholder,
          multiline: textConfig.multiline,
          maxLength: textConfig.maxLength,
        };
      }
      case ControlType.ENUMERATION: {
        const enumConfig = config as EnumerationControlConfig;
        return {
          label: enumConfig.label,
          required: enumConfig.required,
          placeholder: enumConfig.placeholder,
          options: enumConfig.options.map((option: string) => ({
            label: option,
            value: option.toUpperCase().replace(/\s+/g, '_'),
          })),
        };
      }
      case ControlType.MEDIA: {
        const imageConfig = config as ImageControlConfig;
        return {
          label: imageConfig.label,
          required: imageConfig.required,
          allowedTypes: imageConfig.allowedTypes,
          maxSize: imageConfig.maxSize,
        };
      }
      case ControlType.RICHTEXT: {
        const richConfig = config as RichTextControlConfig;
        return {
          label: richConfig.label,
          required: richConfig.required,
          toolbar: richConfig.toolbar,
          maxLength: richConfig.maxLength,
        };
      }
      case ControlType.JSON: {
        const jsonConfig = config as JsonControlConfig;
        let parsedSchema;
        if (jsonConfig.schema.trim()) {
          try {
            parsedSchema = JSON.parse(jsonConfig.schema);
          } catch {
            parsedSchema = undefined;
          }
        }
        return {
          label: jsonConfig.label,
          required: jsonConfig.required,
          schema: parsedSchema,
          pretty: jsonConfig.pretty,
        };
      }
      case ControlType.TABLE: {
        const tableConfig = config as TableControlConfig;
        return {
          label: tableConfig.label,
          required: tableConfig.required,
          title: tableConfig.title,
          caption: tableConfig.caption,
          footnote: tableConfig.footnote,
          headers: tableConfig.headers,
        };
      }
      default:
        return config;
    }
  };

  // Initialize form with existing values when editing
  useEffect(() => {
    if (mode === 'edit' && initialControl) {
      const legacyConfig = initialControl.config as Record<string, unknown>;

      // Convert legacy config to new config format
      let newConfig: ControlConfig;
      switch (initialControl.controlType) {
        case ControlType.TEXT: {
          newConfig = {
            label: (legacyConfig.label as string) || '',
            required: (legacyConfig.required as boolean) || false,
            placeholder: (legacyConfig.placeholder as string) || '',
            multiline: (legacyConfig.multiline as boolean) || false,
            maxLength: legacyConfig.maxLength as number | undefined,
          } as TextControlConfig;
          break;
        }
        case ControlType.ENUMERATION: {
          const options = (legacyConfig.options as Array<{ label: string; value: string }>) || [];
          newConfig = {
            label: (legacyConfig.label as string) || '',
            required: (legacyConfig.required as boolean) || false,
            placeholder: (legacyConfig.placeholder as string) || 'Select an option...',
            options: options.map((opt) => opt.label),
          } as EnumerationControlConfig;
          break;
        }
        case ControlType.MEDIA: {
          newConfig = {
            label: (legacyConfig.label as string) || '',
            required: (legacyConfig.required as boolean) || false,
            allowedTypes: (legacyConfig.allowedTypes as string[]) || ['jpg', 'png', 'gif', 'webp'],
            maxSize: legacyConfig.maxSize as number | undefined,
          } as ImageControlConfig;
          break;
        }
        case ControlType.RICHTEXT: {
          newConfig = {
            label: (legacyConfig.label as string) || '',
            required: (legacyConfig.required as boolean) || false,
            toolbar: (legacyConfig.toolbar as string[]) || ['bold', 'italic', 'link'],
            maxLength: legacyConfig.maxLength as number | undefined,
          } as RichTextControlConfig;
          break;
        }
        case ControlType.JSON: {
          newConfig = {
            label: (legacyConfig.label as string) || '',
            required: (legacyConfig.required as boolean) || false,
            schema: legacyConfig.schema ? JSON.stringify(legacyConfig.schema, null, 2) : '',
            pretty: (legacyConfig.pretty as boolean) || false,
          } as JsonControlConfig;
          break;
        }
        case ControlType.TABLE: {
          const headers = (legacyConfig.headers as Array<string | { id: string; label: string; type?: string }>) || [];
          newConfig = {
            label: (legacyConfig.label as string) || '',
            required: (legacyConfig.required as boolean) || false,
            title: (legacyConfig.title as string) || '',
            caption: (legacyConfig.caption as string) || '',
            footnote: (legacyConfig.footnote as string) || '',
            headers: headers.map((header, index) => {
              if (typeof header === 'string') {
                return {
                  id: `header-${index + 1}`,
                  label: header,
                  type: 'text' as const,
                };
              } else {
                return {
                  id: header.id || `header-${index + 1}`,
                  label: header.label,
                  type: (header.type as 'text' | 'textarea') || 'text',
                };
              }
            }),
          } as TableControlConfig;
          break;
        }
        default:
          newConfig = createDefaultConfig(initialControl.controlType);
          newConfig.label = (legacyConfig.label as string) || '';
          newConfig.required = (legacyConfig.required as boolean) || false;
      }

      setConfig(newConfig);

      // Set the selected control for editing
      const controlDef = BUILT_IN_CONTROLS.find((c) => c.controlType === initialControl.controlType);
      setSelectedControl(controlDef || null);
      setStep('configure');
    } else if (mode === 'add') {
      // Reset to select step for adding new controls
      setStep('select');
      setConfig(null);
      setSelectedControl(null);
    }
  }, [mode, initialControl, open]);

  // Update config when a new control is selected
  useEffect(() => {
    if (selectedControl && !config) {
      setConfig(createDefaultConfig(selectedControl.controlType));
    }
  }, [selectedControl, config]);

  const handleControlSelect = (control: ControlDefinition) => {
    setSelectedControl(control);
    setConfig(createDefaultConfig(control.controlType));
    setStep('configure');
  };

  const handleAddOrUpdateControl = () => {
    if (!selectedControl || !config || !config.label.trim()) return;

    const legacyConfig = transformConfigToLegacy(selectedControl.controlType, config);
    onAddControl(selectedControl.controlType, legacyConfig);
    handleClose();
  };

  const handleClose = () => {
    setSelectedControl(null);
    setConfig(null);
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
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            <Flex align="center" gap="3">
              <Box
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--blue-3)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size="3" weight="bold" style={{ color: 'var(--blue-11)' }}>
                  {control.icon}
                </Text>
              </Box>
              <Box style={{ flex: 1 }}>
                <Text size="3" weight="bold" style={{ marginBottom: '4px' }}>
                  {CONTROL_METADATA[control.controlType].displayName}
                </Text>
                <Text size="2" color="gray">
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
    if (!selectedControl || !config) return null;

    const renderControlSpecificConfig = () => {
      switch (selectedControl.controlType) {
        case ControlType.TEXT:
          return (
            <TextConfig config={config as TextControlConfig} onConfigChange={(newConfig) => setConfig(newConfig)} />
          );
        case ControlType.ENUMERATION:
          return (
            <EnumerationConfig
              config={config as EnumerationControlConfig}
              onConfigChange={(newConfig) => setConfig(newConfig)}
            />
          );
        case ControlType.MEDIA:
          return (
            <ImageConfig config={config as ImageControlConfig} onConfigChange={(newConfig) => setConfig(newConfig)} />
          );
        case ControlType.RICHTEXT:
          return (
            <RichTextConfig
              config={config as RichTextControlConfig}
              onConfigChange={(newConfig) => setConfig(newConfig)}
            />
          );
        case ControlType.JSON:
          return (
            <JsonConfig config={config as JsonControlConfig} onConfigChange={(newConfig) => setConfig(newConfig)} />
          );
        case ControlType.TABLE:
          return (
            <TableConfig config={config as TableControlConfig} onConfigChange={(newConfig) => setConfig(newConfig)} />
          );
        default:
          return null;
      }
    };

    const isFormValid = () => {
      if (!config.label.trim()) return false;

      switch (selectedControl.controlType) {
        case ControlType.ENUMERATION: {
          const enumConfig = config as EnumerationControlConfig;
          return enumConfig.options.length > 0;
        }
        case ControlType.MEDIA: {
          const imageConfig = config as ImageControlConfig;
          return imageConfig.allowedTypes.length > 0;
        }
        case ControlType.JSON: {
          const jsonConfig = config as JsonControlConfig;
          if (jsonConfig.schema.trim()) {
            try {
              JSON.parse(jsonConfig.schema.trim());
              return true;
            } catch {
              return false;
            }
          }
          return true;
        }
        case ControlType.TABLE: {
          const tableConfig = config as TableControlConfig;
          return (
            tableConfig.headers.length > 0 && tableConfig.headers.every((header) => header.label.trim().length > 0)
          );
        }
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

        {renderControlSpecificConfig()}

        <Flex justify="end" gap="3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddOrUpdateControl} disabled={!isFormValid()}>
            {mode === 'edit'
              ? `Update ${CONTROL_METADATA[selectedControl.controlType].displayName}`
              : `Add ${CONTROL_METADATA[selectedControl.controlType].displayName}`}
          </Button>
        </Flex>
      </Box>
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Edit Control' : 'Add New Control'}>
      {step === 'select' ? renderSelectStep() : renderConfigureStep()}
    </Modal>
  );
};
