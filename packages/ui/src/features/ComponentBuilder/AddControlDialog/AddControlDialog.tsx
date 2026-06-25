'use client';

import { Box, Button, Flex, Grid, Text } from '#atoms';
import { Card, Modal } from '#molecules';
import { FormEvent, useEffect, useState } from 'react';
import { CONTROL_METADATA, ControlType } from '../ComponentPreview/ComponentPreview.model';
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
} from '../ControlConfigs';
import { BUILT_IN_CONTROLS } from '../controls';
import type { AddControlDialogProps, ConfigStep } from './AddControlDialog.model';

export const AddControlDialog = ({
  open,
  onOpenChange,
  onAddControl,
  initialControl = null,
  mode = 'add',
}: AddControlDialogProps) => {
  const [step, setStep] = useState<ConfigStep>(mode === 'edit' ? 'configure' : 'select');
  const [selectedControlType, setSelectedControlType] = useState<ControlType | null>(null);
  const [config, setConfig] = useState<ControlConfig | null>(null);

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

  const buildApiConfig = (controlType: ControlType, cfg: ControlConfig): Record<string, unknown> => {
    switch (controlType) {
      case ControlType.TEXT: {
        const c = cfg as TextControlConfig;
        return { required: c.required, placeholder: c.placeholder, multiline: c.multiline, maxLength: c.maxLength };
      }
      case ControlType.ENUMERATION: {
        const c = cfg as EnumerationControlConfig;
        return {
          required: c.required,
          placeholder: c.placeholder,
          options: c.options.map((option) => ({
            label: option,
            value: option.toUpperCase().replace(/\s+/g, '_'),
          })),
        };
      }
      case ControlType.MEDIA: {
        const c = cfg as ImageControlConfig;
        return { required: c.required, allowedTypes: c.allowedTypes, maxSize: c.maxSize };
      }
      case ControlType.RICHTEXT: {
        const c = cfg as RichTextControlConfig;
        return { required: c.required, toolbar: c.toolbar, maxLength: c.maxLength };
      }
      case ControlType.JSON: {
        const c = cfg as JsonControlConfig;
        let parsedSchema;
        if (c.schema.trim()) {
          try {
            parsedSchema = JSON.parse(c.schema);
          } catch {
            parsedSchema = undefined;
          }
        }
        return { required: c.required, schema: parsedSchema, pretty: c.pretty };
      }
      case ControlType.TABLE: {
        const c = cfg as TableControlConfig;
        return { required: c.required, title: c.title, caption: c.caption, footnote: c.footnote, headers: c.headers };
      }
      default:
        return cfg as Record<string, unknown>;
    }
  };

  useEffect(() => {
    if (mode === 'edit' && initialControl) {
      const c = initialControl.config as Record<string, unknown>;
      const label = initialControl.label || '';

      let newConfig: ControlConfig;
      switch (initialControl.controlType) {
        case ControlType.TEXT:
          newConfig = {
            label,
            required: (c.required as boolean) || false,
            placeholder: (c.placeholder as string) || '',
            multiline: (c.multiline as boolean) || false,
            maxLength: c.maxLength as number | undefined,
          } as TextControlConfig;
          break;
        case ControlType.ENUMERATION: {
          const options = (c.options as Array<{ label: string; value: string }>) || [];
          newConfig = {
            label,
            required: (c.required as boolean) || false,
            placeholder: (c.placeholder as string) || 'Select an option...',
            options: options.map((opt) => opt.label),
          } as EnumerationControlConfig;
          break;
        }
        case ControlType.MEDIA:
          newConfig = {
            label,
            required: (c.required as boolean) || false,
            allowedTypes: (c.allowedTypes as string[]) || ['jpg', 'png', 'gif', 'webp'],
            maxSize: c.maxSize as number | undefined,
          } as ImageControlConfig;
          break;
        case ControlType.RICHTEXT:
          newConfig = {
            label,
            required: (c.required as boolean) || false,
            toolbar: (c.toolbar as string[]) || ['bold', 'italic', 'link'],
            maxLength: c.maxLength as number | undefined,
          } as RichTextControlConfig;
          break;
        case ControlType.JSON:
          newConfig = {
            label,
            required: (c.required as boolean) || false,
            schema: c.schema ? JSON.stringify(c.schema, null, 2) : '',
            pretty: (c.pretty as boolean) || false,
          } as JsonControlConfig;
          break;
        case ControlType.TABLE: {
          const headers = (c.headers as Array<string | { id: string; label: string; type?: string }>) || [];
          newConfig = {
            label,
            required: (c.required as boolean) || false,
            title: (c.title as string) || '',
            caption: (c.caption as string) || '',
            footnote: (c.footnote as string) || '',
            headers: headers.map((header, index) =>
              typeof header === 'string'
                ? { id: `header-${index + 1}`, label: header, type: 'text' as const }
                : {
                    id: header.id || `header-${index + 1}`,
                    label: header.label,
                    type: (header.type as 'text' | 'textarea') || 'text',
                  },
            ),
          } as TableControlConfig;
          break;
        }
        default:
          newConfig = createDefaultConfig(initialControl.controlType as ControlType);
          newConfig.label = label;
          newConfig.required = (c.required as boolean) || false;
      }

      setConfig(newConfig);
      setSelectedControlType(initialControl.controlType as ControlType);
      setStep('configure');
    } else if (mode === 'add') {
      setStep('select');
      setConfig(null);
      setSelectedControlType(null);
    }
  }, [mode, initialControl, open]);

  useEffect(() => {
    if (selectedControlType && !config) {
      setConfig(createDefaultConfig(selectedControlType));
    }
  }, [selectedControlType, config]);

  const handleControlSelect = (controlType: ControlType) => {
    setSelectedControlType(controlType);
    setConfig(createDefaultConfig(controlType));
    setStep('configure');
  };

  const handleAddOrUpdateControl = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedControlType || !config || !config.label.trim()) return;

    const apiConfig = buildApiConfig(selectedControlType, config);
    onAddControl(selectedControlType, config.label.trim(), apiConfig);
    handleClose();
  };

  const handleClose = () => {
    setSelectedControlType(null);
    setConfig(null);
    onOpenChange(false);
  };

  const renderSelectStep = () => (
    <Box>
      <Grid columns="1" gap="3">
        {BUILT_IN_CONTROLS.map((control) => (
          <Card key={control.controlType} onClick={() => handleControlSelect(control.controlType)} className="cursor-pointer">
            <Flex gap="3">
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
          </Card>
        ))}
      </Grid>
    </Box>
  );

  const renderConfigureStep = () => {
    if (!selectedControlType || !config) return null;

    const renderControlSpecificConfig = () => {
      switch (selectedControlType) {
        case ControlType.TEXT:
          return <TextConfig config={config as TextControlConfig} onConfigChange={(c) => setConfig(c)} />;
        case ControlType.ENUMERATION:
          return <EnumerationConfig config={config as EnumerationControlConfig} onConfigChange={(c) => setConfig(c)} />;
        case ControlType.MEDIA:
          return <ImageConfig config={config as ImageControlConfig} onConfigChange={(c) => setConfig(c)} />;
        case ControlType.RICHTEXT:
          return <RichTextConfig config={config as RichTextControlConfig} onConfigChange={(c) => setConfig(c)} />;
        case ControlType.JSON:
          return <JsonConfig config={config as JsonControlConfig} onConfigChange={(c) => setConfig(c)} />;
        case ControlType.TABLE:
          return <TableConfig config={config as TableControlConfig} onConfigChange={(c) => setConfig(c)} />;
        default:
          return null;
      }
    };

    const isFormValid = () => {
      if (!config.label.trim()) return false;

      switch (selectedControlType) {
        case ControlType.ENUMERATION:
          return (config as EnumerationControlConfig).options.length > 0;
        case ControlType.MEDIA:
          return (config as ImageControlConfig).allowedTypes.length > 0;
        case ControlType.JSON: {
          const schema = (config as JsonControlConfig).schema.trim();
          if (schema) {
            try {
              JSON.parse(schema);
              return true;
            } catch {
              return false;
            }
          }
          return true;
        }
        case ControlType.TABLE: {
          const tableConfig = config as TableControlConfig;
          return tableConfig.headers.length > 0 && tableConfig.headers.every((h) => h.label.trim().length > 0);
        }
        default:
          return true;
      }
    };

    return (
      <Box as="form" onSubmit={handleAddOrUpdateControl}>
        <Flex gap="2" style={{ marginBottom: '16px' }}>
          {mode === 'add' && (
            <Button size="sm" variant="primary-outline" onClick={() => setStep('select')}>
              ← Back
            </Button>
          )}
          <Text size="3" weight="medium">
            Configure {CONTROL_METADATA[selectedControlType].displayName}
          </Text>
        </Flex>

        {renderControlSpecificConfig()}

        <Flex justify="end" gap="3">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isFormValid()}>
            {mode === 'edit'
              ? `Update ${CONTROL_METADATA[selectedControlType].displayName}`
              : `Add ${CONTROL_METADATA[selectedControlType].displayName}`}
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
