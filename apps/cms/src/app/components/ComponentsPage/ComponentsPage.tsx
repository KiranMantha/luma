'use client';

import {
  addControlToComponent,
  addFieldsetToSection,
  addSectionToComponent,
  deleteComponent,
  deleteControl,
  deleteFieldsetFromSection,
  getComponents,
  saveComponent,
  updateComponent,
  updateControl,
  updateFieldsetInSection,
} from '@/actions';
import {
  ComponentBuilder,
  ComponentBuilderActions,
  ComponentLibrary,
  ComponentPreview,
} from '@repo/ui';
import { use } from 'react';
import type { ComponentsPageProps } from './ComponentsPage.model';
import styles from './ComponentsPage.module.scss';

const actions: ComponentBuilderActions = {
  onSaveComponent: saveComponent,
  onUpdateComponent: (id, name, description) => updateComponent(id, { name, description }),
  onDeleteComponent: deleteComponent,
  onAddControl: addControlToComponent,
  onUpdateControl: (componentId, controlId, data) => updateControl(componentId, controlId, data),
  onDeleteControl: deleteControl,
  onAddSection: addSectionToComponent,
  onAddFieldset: addFieldsetToSection,
  onDeleteFieldset: deleteFieldsetFromSection,
  onUpdateFieldset: updateFieldsetInSection,
  onRefreshComponents: () => getComponents(),
};

export const ComponentsPage = ({ initialComponents, componentId }: ComponentsPageProps) => {
  const initialComponentsData = use(initialComponents);

  return (
    <ComponentBuilder components={initialComponentsData} actions={actions} componentId={componentId}>
      <div className={styles.componentsPage}>
        <div className={styles.libraryPanel}>
          <ComponentLibrary />
        </div>

        <ComponentPreview />
      </div>
    </ComponentBuilder>
  );
};
