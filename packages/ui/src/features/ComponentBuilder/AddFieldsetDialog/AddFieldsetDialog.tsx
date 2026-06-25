'use client';

import { Box, Button, Flex, Input, Text } from '#atoms';
import { Modal } from '#molecules';
import { FormEvent, useEffect, useState } from 'react';
import type { ControlInstance, Fieldset } from '../models';
import { CONTROL_METADATA } from '../ComponentPreview/ComponentPreview.model';
import styles from './AddFieldsetDialog.module.scss';

export type AddFieldsetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFieldset: (name: string, description?: string, controls?: ControlInstance[]) => void;
  onRequestAddControl?: () => void;
  editingStructure?: Fieldset | null;
  pendingControls?: ControlInstance[];
};

export const AddFieldsetDialog = ({
  open,
  onOpenChange,
  onAddFieldset,
  onRequestAddControl,
  editingStructure,
  pendingControls = [],
}: AddFieldsetDialogProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingStructure) {
      setName(editingStructure.name);
      setDescription(editingStructure.description || '');
      setStep(1);
    } else {
      setName('');
      setDescription('');
      setStep(1);
    }
  }, [editingStructure, open]);

  const controls = editingStructure ? (pendingControls.length > 0 ? pendingControls : editingStructure.fields) : pendingControls;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Fieldset name is required');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Fieldset name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Fieldset name must be less than 50 characters');
      return;
    }

    if (step === 1) {
      setStep(2);
      setError('');
    }
  };

  const handleFinish = () => {
    onAddFieldset(name.trim(), description.trim() || undefined, controls.length > 0 ? controls : undefined);
    setName('');
    setDescription('');
    setError('');
    setStep(1);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setError('');
    setStep(1);
    onOpenChange(false);
  };

  const modalTitle = editingStructure
    ? step === 1 ? 'Edit Fieldset' : 'Edit Controls'
    : step === 1 ? 'Add Fieldset' : 'Add Controls';

  return (
    <Modal title={modalTitle} open={open} size="lg" onOpenChange={onOpenChange}>
      {step === 1 ? (
        <Box as="form" onSubmit={handleSubmit} className="space-y-4">
          <Box>
            <Text size="3" className="mb-2">Fieldset Name:</Text>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Submenu Item, Testimonial, Feature"
              autoFocus
              error={error}
            />
            {error && (
              <Text size="2" className="mt-1 text-red-600">{error}</Text>
            )}
          </Box>

          <Box>
            <Text size="3" className="mb-2">Description (Optional):</Text>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this fieldset represents"
            />
          </Box>

          <Flex gap="3" justify="end">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Next</Button>
          </Flex>
        </Box>
      ) : (
        <Box className="space-y-4">
          {controls.length > 0 ? (
            <Box className="mb-4">
              {controls.map((control) => (
                <Box key={control.id} className={styles.controlItem}>
                  <Flex justify="between">
                    <Text size="3" weight="medium">{control.label || 'Unlabeled Field'}</Text>
                    <Text size="1" className="text-gray-600">
                      {CONTROL_METADATA[control.controlType]?.displayName || control.controlType}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Box className={styles.emptyFields}>
              <Text size="2" className="text-gray-600">
                No fields added yet. Click &quot;+ Add Field&quot; to start building your fieldset.
              </Text>
            </Box>
          )}

          <Box className={styles.addControlRow}>
            <Button variant="primary" size="sm" onClick={() => onRequestAddControl?.()}>
              + Add Control
            </Button>
          </Box>

          <Flex gap="3" justify="end">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handleFinish}>
              {editingStructure ? 'Update' : 'Create'} Fieldset
              {controls.length > 0 && ` (${controls.length} field${controls.length !== 1 ? 's' : ''})`}
            </Button>
          </Flex>
        </Box>
      )}
    </Modal>
  );
};
