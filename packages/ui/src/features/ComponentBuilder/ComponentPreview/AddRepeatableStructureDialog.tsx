import { Box, Button, Flex, Input, Text } from '#atoms';
import { Card, Modal } from '#molecules';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { ControlInstance, RepeatableStructure } from '../models';
import { CONTROL_METADATA, ControlType } from './ComponentPreview.model';

export type AddRepeatableStructureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRepeatableStructure: (name: string, description?: string, controls?: ControlInstance[]) => void;
  onRequestAddControl?: () => void; // Callback to request parent to open add control dialog
  editingStructure?: RepeatableStructure | null; // Structure to edit, null for create mode
};

export type AddRepeatableStructureDialogRef = {
  addControl: (controlType: ControlType, config: Record<string, unknown>) => void;
};

export const AddRepeatableStructureDialog = ({
  open,
  onOpenChange,
  onAddRepeatableStructure,
  onRequestAddControl,
  editingStructure,
}: AddRepeatableStructureDialogProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [controls, setControls] = useState<ControlInstance[]>([]);

  // Initialize form with editing structure data
  useEffect(() => {
    if (editingStructure) {
      setName(editingStructure.name);
      setDescription(editingStructure.description || '');
      setControls(editingStructure.fields || []);
      setStep(1); // Start at step 1 for editing to allow name/description changes
    } else {
      // Reset form for create mode
      setName('');
      setDescription('');
      setControls([]);
      setStep(1);
    }
  }, [editingStructure, open]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Structure name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Structure name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Structure name must be less than 50 characters');
      return;
    }

    if (step === 1) {
      // Move to step 2 - define controls
      setStep(2);
      setError('');
    } else {
      // Step 2 - Create the structure (this happens when user clicks "Create Structure")
      onAddRepeatableStructure(
        trimmedName,
        description.trim() || undefined,
        controls.length > 0 ? controls : undefined,
      );

      // Reset form
      setName('');
      setDescription('');
      setControls([]);
      setStep(1);
      setError('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setControls([]);
    setError('');
    setStep(1);
    onOpenChange(false);
  };

  const handleRemoveControl = (controlId: string) => {
    setControls(controls.filter((c) => c.id !== controlId));
  };

  // Add a method that parent can call to add a control
  const addControl = useCallback(
    (controlType: ControlType, config: Record<string, unknown>) => {
      const newControl: ControlInstance = {
        id: `ctrl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        controlType,
        label: (config.label as string) || 'Untitled Control',
        config,
        order: controls.length,
      };

      setControls((prev) => [...prev, newControl]);
    },
    [controls.length],
  ); // Expose addControl method to window for parent access (temporary approach)
  useEffect(() => {
    if (open) {
      (window as unknown as Record<string, unknown>).addControlToRepeatableStructure = addControl;
    } else {
      delete (window as unknown as Record<string, unknown>).addControlToRepeatableStructure;
    }

    return () => {
      delete (window as unknown as Record<string, unknown>).addControlToRepeatableStructure;
    };
  }, [open, addControl]);
  return (
    <Modal
      title={editingStructure 
        ? (step === 1 ? 'Edit Repeatable Structure' : 'Edit Controls')
        : (step === 1 ? 'Add Repeatable Structure' : 'Add Controls')
      }
      open={open}
      size="lg"
      onOpenChange={onOpenChange}
    >
      {step === 1 ? (
        <Box as="form" onSubmit={handleSubmit} className="space-y-4">
          <Box>
            <Text size="3" className="mb-2">
              Structure Name:
            </Text>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(''); // Clear error on change
              }}
              placeholder="e.g., Submenu Item, Testimonial, Feature"
              autoFocus
              error={error}
            />
            {error && (
              <Text size="2" className="mt-1 text-red-600">
                {error}
              </Text>
            )}
          </Box>

          <Box>
            <Text size="3" className="mb-2">
              Description (Optional):
            </Text>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this structure represents"
            />
          </Box>
          <Flex gap="3" justify="end">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Next
            </Button>
          </Flex>
        </Box>
      ) : (
        <Box className="space-y-4">
          {controls.length > 0 && (
            <Box className="mb-4">
              <Box className="space-y-2">
                {controls.map((control) => (
                  <Box key={control.id} className="bg-gray-100 border-1 border-gray-300 rounded-sm p-4 mb-3">
                    <Flex justify="between">
                      <Text size="3" weight="medium">
                        {control.label || 'Unlabeled Field'}
                      </Text>
                      <Flex gap="2">
                        <Text size="1" className="text-gray-600">
                          {CONTROL_METADATA[control.controlType]?.displayName || control.controlType}
                        </Text>
                        <Button size="sm" variant="primary-outline">
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="primary-outline"
                          color="red"
                          className="text-red-600"
                          onClick={() => handleRemoveControl(control.id)}
                        >
                          Delete
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {controls.length === 0 && (
            <Box className="rounded border border-gray-200 bg-gray-50 p-4 text-center">
              <Text size="2" className="text-gray-600">
                No fields added yet. Click &quot;+ Add Field&quot; to start building your repeatable structure.
              </Text>
            </Box>
          )}

          <Box className="text-center">
            <Button variant="primary" size="sm" onClick={() => onRequestAddControl?.()}>
              + Add Control
            </Button>
          </Box>

          <Flex gap="3" justify="end">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => {
                // Create structure with controls if any were added
                onAddRepeatableStructure(
                  name.trim(),
                  description.trim() || undefined,
                  controls.length > 0 ? controls : undefined,
                );

                // Reset form
                setName('');
                setDescription('');
                setControls([]);
                setStep(1);
                setError('');
                onOpenChange(false);
              }}
            >
              {editingStructure ? 'Update' : 'Create'} Structure {controls.length > 0 && `(${controls.length} field${controls.length !== 1 ? 's' : ''})`}
            </Button>
          </Flex>
        </Box>
      )}
    </Modal>
  );
};
