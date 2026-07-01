'use client';

import { Button, Flex, Text } from '../../atoms';
import { Modal } from '../../molecules';
import type { Component } from '../ComponentBuilder/models';

export type ComponentSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: Component[];
  onSelect: (component: Component) => void;
};

export const ComponentSelectionDialog = ({
  open,
  onOpenChange,
  components,
  onSelect,
}: ComponentSelectionDialogProps) => {
  const handleSelect = (component: Component) => {
    onOpenChange(false);
    onSelect(component);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add Component">
      {components.length === 0 ? (
        <Text size="2" color="gray">No components available.</Text>
      ) : (
        <Flex direction="column" gap="2">
          {components.map((c) => (
            <Button
              key={c.id}
              variant="primary-outline"
              onClick={() => handleSelect(c)}
              style={{ justifyContent: 'flex-start' }}
            >
              <div>
                <Text size="2" weight="medium">{c.name}</Text>
                {c.description && (
                  <Text size="1" color="gray">{c.description}</Text>
                )}
              </div>
            </Button>
          ))}
        </Flex>
      )}
      <Flex justify="end" className="mt-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
      </Flex>
    </Modal>
  );
};
