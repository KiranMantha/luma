'use client';

import { Box, Flex, Grid, Text } from '@radix-ui/themes';
import { Button, Input, Modal } from '@repo/ui';
import { ChangeEvent, useEffect, useState } from 'react';
import type { AddControlDialogProps, ConfigStep } from './AddControlDialog.model';
import { BUILT_IN_CONTROLS, type ControlDefinition, type TextBoxConfig } from './controls';

export const AddControlDialog = ({
  open,
  onOpenChange,
  onAddControl,
  initialControl = null,
  mode = 'add',
}: AddControlDialogProps) => {
  const [step, setStep] = useState<ConfigStep>(mode === 'edit' ? 'configure' : 'select');
  const [selectedControl, setSelectedControl] = useState<ControlDefinition | null>(null);

  // TextBox specific config
  const [label, setLabel] = useState('');
  const [multiline, setMultiline] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);

  // Initialize form with existing values when editing
  useEffect(() => {
    if (mode === 'edit' && initialControl && initialControl.controlType === 'textbox') {
      const config = initialControl.config as unknown as TextBoxConfig;
      setLabel(config.label || '');
      setMultiline(config.multiline || false);
      setPlaceholder(config.placeholder || '');
      setRequired(config.required || false);

      // Set the selected control for editing
      const controlDef = BUILT_IN_CONTROLS.find((c) => c.id === initialControl.controlType);
      setSelectedControl(controlDef || null);
      setStep('configure'); // Ensure we're on the configure step for editing
    } else if (mode === 'add') {
      // Reset to select step for adding new controls
      setStep('select');
    }
  }, [mode, initialControl, open]); // Add 'open' to dependencies

  const handleControlSelect = (control: ControlDefinition) => {
    setSelectedControl(control);
    if (control.configurable) {
      setStep('configure');
    } else {
      // For non-configurable controls, add immediately
      onAddControl(control.id, {});
      handleClose();
    }
  };

  const handleAddTextBox = () => {
    if (!label.trim()) return;

    const config: TextBoxConfig = {
      label: label.trim(),
      multiline,
      placeholder: placeholder.trim() || undefined,
      required,
    };

    onAddControl('textbox', config);
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
    setLabel('');
    setMultiline(false);
    setPlaceholder('');
    setRequired(false);
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
            key={control.id}
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
                  {control.name}
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
    if (selectedControl?.id === 'textbox') {
      return (
        <Box>
          <Flex align="center" gap="2" style={{ marginBottom: '16px' }}>
            <Button variant="outline" size="1" onClick={() => setStep('select')}>
              ← Back
            </Button>
            <Text size="3" weight="bold">
              Configure {selectedControl.name}
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

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              <Text size="2">Required field</Text>
            </label>
          </Flex>

          <Flex gap="3" justify="end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleAddTextBox} disabled={!label.trim()}>
              {mode === 'edit' ? 'Update Text Box' : 'Add Text Box'}
            </Button>
          </Flex>
        </Box>
      );
    }

    return null;
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={mode === 'edit' ? 'Edit Control' : 'Add Control'}>
      <Box style={{ minWidth: '400px' }}>{step === 'select' ? renderSelectStep() : renderConfigureStep()}</Box>
    </Modal>
  );
};
