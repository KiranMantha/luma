'use client';

import { Button, Flex, Tabs, Text } from '#atoms';
import { Card } from '#molecules';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentSection, ControlInstance } from '../models';
import { AddSectionDialog } from './AddSectionDialog';
import type { BaseControlConfig, ComponentPreviewProps } from './ComponentPreview.model';
import { CONTROL_METADATA, ControlType } from './ComponentPreview.model';
import styles from './ComponentPreview.module.scss';

export const ComponentPreview = ({
  component,
  activeTabId: controlledActiveTabId,
  onAddControl,
  onEditControl,
  onDeleteControl,
  onAddSection,
  onActiveTabChange,
}: ComponentPreviewProps) => {
  const [internalActiveTabId, setInternalActiveTabId] = useState<string>('');
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);

  // Memoize sections to avoid dependency changes on every render
  const sections = useMemo(() => component?.sections || [], [component?.sections]);

  // Use controlled activeTabId if provided, otherwise use internal state
  const activeTabId = controlledActiveTabId || internalActiveTabId;

  // Set active tab to first section if not set (in useEffect to avoid setState during render)
  useEffect(() => {
    if (sections.length > 0 && !activeTabId && sections[0]) {
      const firstSectionId = sections[0].id;
      if (controlledActiveTabId !== undefined) {
        onActiveTabChange?.(firstSectionId);
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
      onActiveTabChange?.(tabId);
    } else {
      setInternalActiveTabId(tabId);
    }
  };

  const handleAddSection = (sectionName: string) => {
    // Call the parent's onAddSection to make the API call
    if (onAddSection) {
      onAddSection(sectionName);
    }
  };

  const handleAddControl = (sectionId?: string) => {
    // Use active tab as default section if no specific section provided
    const targetSectionId = sectionId || activeTabId;
    onAddControl?.(targetSectionId);
  };

  const renderControlPreview = (
    control: ControlInstance,
    onEditControl?: (control: ControlInstance) => void,
    onDeleteControl?: (controlId: string) => void,
  ) => {
    // Get base config that all controls share
    const baseConfig = control.config as BaseControlConfig;

    // Get metadata for this control type
    const metadata = CONTROL_METADATA[control.controlType];

    if (!metadata) {
      return (
        <div className={styles.unknownControl}>
          <span>Unknown control type: {control.controlType}</span>
        </div>
      );
    }

    // Generate metadata display based on control characteristics
    const getControlMetadata = () => {
      const metadataItems: string[] = [metadata.displayName];
      const config = control.config as Record<string, unknown>;

      // Add specific characteristics based on our 6 control types
      switch (control.controlType) {
        case ControlType.TEXT:
          if (config.multiline) {
            metadataItems[0] = 'Multiline Text';
          }
          if (config.maxLength) {
            metadataItems.push(`Max: ${config.maxLength}`);
          }
          break;

        case ControlType.ENUMERATION:
          if (Array.isArray(config.options) && config.options.length) {
            metadataItems.push(`${config.options.length} options`);
          }
          break;

        case ControlType.MEDIA:
          if (config.allowedTypes) {
            metadataItems.push(`Types: ${(config.allowedTypes as string[]).join(', ')}`);
          }
          if (config.maxSize) {
            metadataItems.push(`Max: ${config.maxSize}MB`);
          }
          break;

        case ControlType.RICHTEXT:
          if (Array.isArray(config.toolbar) && config.toolbar.length) {
            metadataItems.push(`Tools: ${config.toolbar.length}`);
          }
          break;

        case ControlType.JSON:
          if (config.schema) {
            metadataItems.push('Schema validation');
          }
          if (config.pretty) {
            metadataItems.push('Pretty print');
          }
          break;

        case ControlType.TABLE:
          if (config.headers && Array.isArray(config.headers)) {
            metadataItems.push(`${config.headers.length} columns`);
          }
          if (config.caption) {
            metadataItems.push('With caption');
          }
          if (config.footnote) {
            metadataItems.push('With footnote');
          }
          break;
      }

      return metadataItems.join(' • ');
    };

    return (
      <Card className={styles.controlPreview}>
        <Flex justify="between">
          <Text size="3" weight="medium">
            {baseConfig.label || 'Unlabeled Control'}
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
            <Button size="sm" variant="primary-outline" onClick={() => onEditControl?.(control)}>
              Edit
            </Button>
            <Button size="sm" variant="danger-outline" onClick={() => onDeleteControl?.(control.id)}>
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
          {section.controls.length} control{section.controls.length !== 1 ? 's' : ''} in {section.name}
        </Text>
        <Button size="sm" variant="primary" onClick={() => handleAddControl(section.id)}>
          + Add Control
        </Button>
      </Flex>

      <div className={styles.controlsList}>
        {section.controls.length > 0 ? (
          section.controls.map((control) => (
            <div key={control.id} className={styles.controlItem}>
              {renderControlPreview(control, onEditControl, onDeleteControl)}
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
    </div>
  );

  // All components now have sections, render sectioned interface with tabs
  const tabs = sections.map((section) => ({
    id: section.id,
    label: `${section.name} (${section.controls.length})`,
    content: renderSectionContent(section),
  }));

  return (
    <div className={styles.componentPreviewContainer}>
      <Flex justify="between" className={styles.header}>
        <Text as="h2" size="5" weight="bold">
          {component.name} Preview
        </Text>
        <Flex gap="2">
          {onAddSection && (
            <Button variant="ghost" onClick={() => setIsAddSectionDialogOpen(true)}>
              + Add Section
            </Button>
          )}
        </Flex>
      </Flex>

      <Card className={styles.compositionArea}>
        <Tabs tabs={tabs} activeTab={activeTabId} onTabChange={handleTabChange} />
      </Card>

      <AddSectionDialog
        open={isAddSectionDialogOpen}
        onOpenChange={setIsAddSectionDialogOpen}
        onAddSection={handleAddSection}
      />
    </div>
  );
};
