import { Box, Button, Flex, Input, Text } from '#atoms';
import { Modal } from '#molecules';
import { FormEvent, useState } from 'react';

export type AddSectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSection: (sectionName: string, isRepeatable?: boolean, minItems?: number, maxItems?: number) => void;
};

export const AddSectionDialog = ({ open, onOpenChange, onAddSection }: AddSectionDialogProps) => {
  const [sectionName, setSectionName] = useState('');
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [minItems, setMinItems] = useState<number>(0);
  const [maxItems, setMaxItems] = useState<number | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = sectionName.trim();

    if (!trimmedName) {
      setError('Section name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Section name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Section name must be less than 50 characters');
      return;
    }

    // Convert maxItems from string to number if provided
    const maxItemsValue = maxItems === '' ? undefined : Number(maxItems);

    onAddSection(trimmedName, isRepeatable, isRepeatable ? minItems : undefined, maxItemsValue);
    setSectionName('');
    setIsRepeatable(false);
    setMinItems(0);
    setMaxItems('');
    setError('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSectionName('');
    setIsRepeatable(false);
    setMinItems(0);
    setMaxItems('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add New Section">
      <Box as="form" onSubmit={handleSubmit} className="space-y-4">
        <Box>
          <Text size="3" className="mb-2">
            Enter a name for the new section:
          </Text>
          <Input
            type="text"
            value={sectionName}
            onChange={(e) => {
              setSectionName(e.target.value);
              if (error) setError(''); // Clear error on change
            }}
            placeholder="e.g., Header, Content, Footer"
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
          <Flex align="center" gap="2" className="mb-2">
            <input
              type="checkbox"
              id="isRepeatable"
              checked={isRepeatable}
              onChange={(e) => setIsRepeatable(e.target.checked)}
              className="h-4 w-4"
            />
            <Text as="label" htmlFor="isRepeatable" size="3">
              Make this section repeatable
            </Text>
          </Flex>
          <Text size="2" className="mb-3 text-gray-600">
            Repeatable sections allow content authors to add multiple instances (e.g., navigation menu items,
            testimonials, features list)
          </Text>

          {isRepeatable && (
            <Box className="ml-6 space-y-3 rounded bg-gray-50 p-3">
              <Flex gap="3">
                <Box className="flex-1">
                  <Text size="2" className="mb-1">
                    Minimum items:
                  </Text>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={minItems}
                    onChange={(e) => setMinItems(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                  />
                </Box>
                <Box className="flex-1">
                  <Text size="2" className="mb-1">
                    Maximum items (optional):
                  </Text>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={maxItems}
                    onChange={(e) =>
                      setMaxItems(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))
                    }
                    placeholder="No limit"
                  />
                </Box>
              </Flex>
              <Text size="2" className="text-gray-600">
                Example: Navigation menus might have min=1, max=10. Testimonials might have no limits.
              </Text>
            </Box>
          )}
        </Box>

        <Flex gap="3" justify="end">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!sectionName.trim()}>
            Add Section
          </Button>
        </Flex>
      </Box>
    </Modal>
  );
};
