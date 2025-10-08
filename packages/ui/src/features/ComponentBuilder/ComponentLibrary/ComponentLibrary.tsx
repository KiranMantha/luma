'use client';

import { Button, Text } from '#atoms';
import { Card } from '#molecules';
import styles from './ComponentLibrary.module.scss';

export interface Component {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  type: 'primitive' | 'user-defined';
  isPrimitive?: boolean;
  controls?: ControlInstance[];
}

export interface ControlInstance {
  id: string;
  controlType: string;
  label?: string;
  config: Record<string, unknown>;
  order: number;
}

export interface ComponentLibraryProps {
  components: Component[];
  selectedComponent?: Component | null;
  onAddComponent?: () => void;
  onEditComponent?: (component: Component) => void;
  onDeleteComponent?: (componentId: string) => void;
  onSelectComponent?: (component: Component) => void;
}

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
        <Text size="5" weight="bold">
          Components
        </Text>
        <Button onClick={onAddComponent}>Add Component</Button>
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
              component.type === 'primitive' ? styles.primitive : styles.userDefined
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
                    <Text size="1" color="gray" style={{ display: 'block', marginTop: '8px' }}>
                      {component.type === 'primitive'
                        ? 'Primitive Component'
                        : `Created: ${new Date(component.createdAt).toLocaleDateString()}`}
                    </Text>
                  </div>
                  <div className={styles.cardActions}>
                    {onEditComponent && component.type === 'user-defined' && (
                      <Button size="1" variant="outline" onClick={() => onEditComponent(component)}>
                        Edit
                      </Button>
                    )}
                    {onDeleteComponent && component.type === 'user-defined' && (
                      <Button size="1" variant="outline" color="red" onClick={() => onDeleteComponent(component.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
