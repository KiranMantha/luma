'use client';

import { Box, Button, Flex, Text } from '#atoms';
import { Card } from '#molecules';
import { ComponentType } from '../models';
import type { ComponentLibraryProps } from './ComponentLibrary.model';
import styles from './ComponentLibrary.module.scss';

export const ComponentLibrary = ({
  components,
  selectedComponent,
  onAddComponent,
  onEditComponent,
  onDeleteComponent,
  onSelectComponent,
}: ComponentLibraryProps) => {
  return (
    <Flex direction="column" align="stretch" className={styles.componentLibrary}>
      <Flex justify="between" className={styles.header}>
        <Text size="5" weight="bold">
          Components
        </Text>
        <Button variant="ghost" color="blue" size="reg" onClick={onAddComponent}>
          Add Component
        </Button>
      </Flex>

      <Box className={styles.content}>
        {components.length === 0 ? (
          <div className={styles.emptyState}>
            <Text color="gray">No components yet. Create your first component!</Text>
          </div>
        ) : (
          components.map((component) => {
            const isSelected = selectedComponent?.id === component.id;
            const cardClassName = `${styles.componentCard} ${
              component.type === ComponentType.PRIMITIVE ? styles.primitive : styles.userDefined
            } ${isSelected ? styles.selected : ''}`;

            return (
              <Card key={component.id} className={cardClassName} onClick={() => onSelectComponent?.(component)}>
                <Flex align="start" justify="between" className={styles.cardContent}>
                  <div className={styles.cardInfo}>
                    <Text size="3" weight="medium">
                      {component.name}
                    </Text>
                    {component.description && (
                      <Text size="2" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                        {component.description}
                      </Text>
                    )}
                  </div>
                  {component.type === ComponentType.USER_DEFINED ? (
                    <Flex gap="2">
                      <Button size="sm" variant="primary-outline" onClick={() => onEditComponent?.(component)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="primary-outline"
                        color="red"
                        onClick={() => onDeleteComponent?.(component.id)}
                      >
                        Delete
                      </Button>
                    </Flex>
                  ) : null}
                </Flex>
              </Card>
            );
          })
        )}
      </Box>
    </Flex>
  );
};
