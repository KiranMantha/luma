'use client';

import { Button, Flex, Tabs, Text } from '#atoms';
import { Card } from '#molecules';
import { useEffect, useMemo, useState } from 'react';
import { AddFieldsetDialog } from '../AddFieldsetDialog';
import { AddSectionDialog } from '../AddSectionDialog';
import { useComponentBuilder } from '../ComponentBuilderContext';
import type { ComponentSection, ControlInstance, Fieldset } from '../models';
import type { BaseControlConfig } from './ComponentPreview.model';
import { CONTROL_METADATA, ControlType } from './ComponentPreview.model';
import styles from './ComponentPreview.module.scss';

export const ComponentPreview = () => {
  const {
    selectedComponent: component,
    activeTabId: controlledActiveTabId,
    pendingFieldsetControls,
    onTriggerAddControl: onAddControl,
    onTriggerEditControl: onEditControl,
    onTriggerDeleteControl: onDeleteControl,
    onAddSection,
    onAddFieldset,
    onDeleteFieldset,
    onUpdateFieldset,
    onRequestAddControlToFieldset,
    onActiveTabChange,
  } = useComponentBuilder();

  const [internalActiveTabId, setInternalActiveTabId] = useState<string>('');
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddFieldsetDialog, setShowAddFieldsetDialog] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const [editingFieldset, setEditingFieldset] = useState<Fieldset | null>(null);

  const sections = useMemo(() => component?.sections || [], [component?.sections]);
  const activeTabId = controlledActiveTabId || internalActiveTabId;

  useEffect(() => {
    if (sections.length > 0 && !activeTabId && sections[0]) {
      const firstSectionId = sections[0].id;
      if (controlledActiveTabId !== undefined) {
        onActiveTabChange(firstSectionId);
      } else {
        setInternalActiveTabId(firstSectionId);
      }
    }
  }, [sections, activeTabId, controlledActiveTabId, onActiveTabChange]);

  if (!component) {
    return <div className={styles.componentPreviewContainer} />;
  }

  const handleTabChange = (tabId: string) => {
    if (controlledActiveTabId !== undefined) {
      onActiveTabChange(tabId);
    } else {
      setInternalActiveTabId(tabId);
    }
  };

  const handleAddControl = (sectionId?: string) => {
    onAddControl(sectionId || activeTabId);
  };

  const handleAddFieldset = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setEditingFieldset(null);
    setShowAddFieldsetDialog(true);
  };

  const handleAddFieldsetSubmit = (name: string, description?: string, controls?: ControlInstance[]) => {
    if (editingFieldset) {
      onUpdateFieldset(editingFieldset.id, name, description, controls);
    } else if (currentSectionId) {
      onAddFieldset(currentSectionId, name, description, controls);
    }
    setCurrentSectionId('');
    setEditingFieldset(null);
  };

  const handleEditFieldset = (fieldset: Fieldset) => {
    setEditingFieldset(fieldset);
    setCurrentSectionId(getSectionIdForFieldset(fieldset.id));
    setShowAddFieldsetDialog(true);
  };

  const getSectionIdForFieldset = (fieldsetId: string): string => {
    for (const section of sections) {
      if (section.fieldsets?.some((f) => f.id === fieldsetId)) return section.id;
    }
    return '';
  };

  const renderFieldsetPreview = (fieldset: Fieldset) => (
    <Card className={styles.fieldsetPreview}>
      <Flex justify="between">
        <Text size="3" weight="medium">
          {fieldset.name}
        </Text>
        <Flex gap="2" className={styles.controlActions}>
          <Text size="1" className={styles.controlMeta}>
            Fieldset ({fieldset.fields?.length || 0} field{(fieldset.fields?.length || 0) !== 1 ? 's' : ''})
          </Text>
          <Button size="sm" variant="primary-outline" onClick={() => handleEditFieldset(fieldset)}>
            Edit
          </Button>
          <Button size="sm" variant="danger-outline" onClick={() => onDeleteFieldset(fieldset.id)}>
            Delete
          </Button>
        </Flex>
      </Flex>
    </Card>
  );

  const renderControlPreview = (control: ControlInstance) => {
    const baseConfig = control.config as BaseControlConfig;
    const metadata = CONTROL_METADATA[control.controlType];

    if (!metadata) {
      return (
        <div className={styles.unknownControl}>
          <span>Unknown control type: {control.controlType}</span>
        </div>
      );
    }

    const getControlMetadata = () => {
      const metadataItems: string[] = [metadata.displayName];
      const config = control.config as Record<string, unknown>;

      switch (control.controlType) {
        case ControlType.TEXT:
          if (config.multiline) metadataItems[0] = 'Multiline Text';
          if (config.maxLength) metadataItems.push(`Max: ${config.maxLength}`);
          break;
        case ControlType.ENUMERATION:
          if (Array.isArray(config.options) && config.options.length)
            metadataItems.push(`${config.options.length} options`);
          break;
        case ControlType.MEDIA:
          if (config.allowedTypes) metadataItems.push(`Types: ${(config.allowedTypes as string[]).join(', ')}`);
          if (config.maxSize) metadataItems.push(`Max: ${config.maxSize}MB`);
          break;
        case ControlType.RICHTEXT:
          if (Array.isArray(config.toolbar) && config.toolbar.length)
            metadataItems.push(`Tools: ${config.toolbar.length}`);
          break;
        case ControlType.JSON:
          if (config.schema) metadataItems.push('Schema validation');
          if (config.pretty) metadataItems.push('Pretty print');
          break;
        case ControlType.TABLE:
          if (config.headers && Array.isArray(config.headers)) metadataItems.push(`${config.headers.length} columns`);
          if (config.caption) metadataItems.push('With caption');
          if (config.footnote) metadataItems.push('With footnote');
          break;
      }

      return metadataItems.join(' • ');
    };

    return (
      <Card className={styles.controlPreview}>
        <Flex justify="between">
          <Text size="3" weight="medium">
            {control.label || 'Unlabeled Control'}
          </Text>
          <Flex gap="2" className={styles.controlActions}>
            <Text size="1" className={styles.controlMeta}>
              {getControlMetadata()}
            </Text>
            {baseConfig.required && (
              <Text size="1" weight="medium" className={styles.requiredIndicator}>
                Required
              </Text>
            )}
            <Button size="sm" variant="primary-outline" onClick={() => onEditControl(control)}>
              Edit
            </Button>
            <Button size="sm" variant="danger-outline" onClick={() => onDeleteControl(control.id)}>
              Delete
            </Button>
          </Flex>
        </Flex>
      </Card>
    );
  };

  const renderSectionContent = (section: ComponentSection) => (
    <div className={styles.sectionContent}>
      <Flex justify="between" align="center" className={styles.sectionHeader}>
        <Text size="4" weight="medium">
          {section.controls.length} control{section.controls.length !== 1 ? 's' : ''}
          {section.fieldsets &&
            section.fieldsets.length > 0 &&
            `, ${section.fieldsets.length} fieldset${section.fieldsets.length !== 1 ? 's' : ''}`}{' '}
          in {section.name}
        </Text>
        <Flex gap="2">
          <Button size="sm" variant="primary" onClick={() => handleAddFieldset(section.id)}>
            + Add Fieldset
          </Button>
          <Button size="sm" variant="primary" onClick={() => handleAddControl(section.id)}>
            + Add Control
          </Button>
        </Flex>
      </Flex>

      <div className={styles.controlsList}>
        {section.controls.length > 0 ? (
          section.controls.map((control) => (
            <div key={control.id} className={styles.controlItem}>
              {renderControlPreview(control)}
            </div>
          ))
        ) : (
          <div className={styles.emptyControls}>
            <Text size="3" className={styles.emptyText}>
              No controls in this section yet. Click &quot;Add Control&quot; to start building.
            </Text>
          </div>
        )}
      </div>

      {section.fieldsets && section.fieldsets.length > 0 && (
        <div className={styles.fieldsetsList}>
          {section.fieldsets.map((fieldset) => (
            <div key={fieldset.id} className={styles.fieldsetItem}>
              {renderFieldsetPreview(fieldset)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const tabs = sections.map((section) => ({
    id: section.id,
    label: section.name,
    content: renderSectionContent(section),
  }));

  return (
    <div className={styles.componentPreviewContainer}>
      <Flex justify="between" className={styles.header}>
        <Text as="h2" size="5" weight="bold">
          {component.name} Preview
        </Text>
        <Flex gap="2">
          <Button variant="ghost" onClick={() => setShowAddSectionDialog(true)}>
            + Add Section
          </Button>
        </Flex>
      </Flex>

      <Card className={styles.compositionArea}>
        <Tabs tabs={tabs} activeTab={activeTabId} onTabChange={handleTabChange} />
      </Card>

      <AddSectionDialog
        open={showAddSectionDialog}
        onOpenChange={setShowAddSectionDialog}
        onAddSection={onAddSection}
      />

      <AddFieldsetDialog
        open={showAddFieldsetDialog}
        onOpenChange={(open) => {
          setShowAddFieldsetDialog(open);
          if (!open) setEditingFieldset(null);
        }}
        onAddFieldset={handleAddFieldsetSubmit}
        onRequestAddControl={onRequestAddControlToFieldset}
        editingStructure={editingFieldset}
        pendingControls={pendingFieldsetControls}
      />
    </div>
  );
};
