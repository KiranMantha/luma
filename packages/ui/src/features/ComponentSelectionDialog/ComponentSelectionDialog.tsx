'use client';

import { Box, Button, Flex, Text } from '../../atoms';
import { Modal } from '../../molecules';
import type { Component } from '../ComponentBuilder/models';
import styles from './ComponentSelectionDialog.module.scss';

export type ComponentSelectionDialogProps = {
  open: boolean;
  components: Component[];
  onSelect: (component: Component) => void;
  onOpenChange: (open: boolean) => void;
};

export const ComponentSelectionDialog = ({
  open,
  components,
  onSelect,
  onOpenChange,
}: ComponentSelectionDialogProps) => {
  const handleSelect = (component: Component) => {
    onOpenChange(false);
    onSelect(component);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add Component">
      {components.length === 0 ? (
        <Text size="2" color="gray">
          No components available.
        </Text>
      ) : (
        <Box>
          {components.map((c) => (
            <Box key={c.id} className={styles.componentCard} onClick={() => handleSelect(c)}>
              <Text size="2" weight="medium">
                {c.name}
              </Text>
            </Box>
          ))}
        </Box>
      )}
      <Flex justify="end" className="mt-4">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </Flex>
    </Modal>
  );
};
