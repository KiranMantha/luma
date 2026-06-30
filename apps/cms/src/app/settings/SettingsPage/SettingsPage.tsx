'use client';

import type { ProjectSettings } from '@/actions/settings';
import { saveSettings } from '@/actions/settings';
import { Box, Button, Flex, Input, Text } from '@repo/ui';
import { ChangeEvent, FormEvent, use, useState } from 'react';
import styles from './SettingsPage.module.scss';
import { SnippetGenerator } from './SnippetGenerator';

type Tab = 'general' | 'integration';

type SettingsPageProps = {
  initialSettings: Promise<ProjectSettings>;
};

export const SettingsPage = ({ initialSettings }: SettingsPageProps) => {
  const settings = use(initialSettings);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [projectName, setProjectName] = useState(settings.projectName ?? '');
  const [previewUrl, setPreviewUrl] = useState(settings.previewUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({ projectName: projectName.trim(), previewUrl: previewUrl.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="p-4">
      <Text size="7" weight="bold" className="mb-6">
        Settings
      </Text>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'integration' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          Integration
        </button>
      </div>

      {activeTab === 'general' && (
        <Box as="form" onSubmit={handleSave} className={styles.tabPanel}>
          <Text size="4" weight="medium" className="mb-4">
            Project
          </Text>
          <Text size="2" color="gray" className="mb-4">
            Identifies this CMS instance. The project name is used to namespace component types in the page model
            (e.g. <code>my-project/components/header</code>).
          </Text>
          <div className={styles.fieldRow}>
            <Input
              label="Project Name"
              value={projectName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
              placeholder="my-project"
            />
          </div>

          <Text size="4" weight="medium" className="mb-4 mt-6">
            Live Preview
          </Text>
          <Text size="2" color="gray" className="mb-4">
            The URL of your remote front-end app. When set, the page editor will show a live preview iframe alongside
            the zone builder.
          </Text>
          <div className={styles.fieldRow}>
            <Input
              label="Remote Preview URL"
              value={previewUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPreviewUrl(e.target.value)}
              placeholder="http://localhost:3010"
              type="url"
            />
          </div>

          <Flex gap="3" className="mt-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
            </Button>
          </Flex>
        </Box>
      )}

      {activeTab === 'integration' && (
        <Box className={styles.tabPanel}>
          <Text size="4" weight="medium" className="mb-2">
            Framework Snippets
          </Text>
          <SnippetGenerator />
        </Box>
      )}
    </Box>
  );
};
