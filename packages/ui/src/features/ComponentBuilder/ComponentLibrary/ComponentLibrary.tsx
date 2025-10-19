'use client';

import { Button, Text } from '#atoms';
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
    <div className={styles.componentLibrary}>
      <div className={styles.header}>
        <Text className={`underline ${styles.title}`}>Components</Text>
        <Button variant="ghost" onClick={onAddComponent}>
          Add Component
        </Button>
      </div>

      <div className={styles.content}>
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
                <div className={styles.cardContent}>
                  <div className={styles.cardInfo}>
                    <Text size="3" weight="bold">
                      {component.name}
                    </Text>
                    {component.description && (
                      <Text size="2" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                        {component.description}
                      </Text>
                    )}
                  </div>
                  {component.type === ComponentType.USER_DEFINED ? (
                    <div className={styles.cardActions}>
                      <Button size="1" variant="outline" onClick={() => onEditComponent?.(component)}>
                        Edit
                      </Button>
                      <Button size="1" variant="outline" color="red" onClick={() => onDeleteComponent?.(component.id)}>
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
