'use client';

import { Box, Button, Flex, Input, Text } from '@repo/ui';
import { ChangeEvent, useState } from 'react';
import styles from './RemotePreview.module.scss';

type RemotePreviewProps = {
  contentId: string;
  contentType: 'template' | 'page';
  initialPreviewUrl?: string;
};

export const RemotePreview = ({
  contentId,
  contentType,
  initialPreviewUrl = 'http://localhost:3003',
}: RemotePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Construct the preview URL with content parameters
  const getPreviewUrl = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';
    const contentApiUrl = `${apiBaseUrl}/api/content/${contentType}s/${contentId}`;

    // Pass the content API URL to the remote app
    const params = new URLSearchParams({
      contentApi: contentApiUrl,
      contentType: contentType,
      contentId: contentId,
      preview: 'true',
    });

    return `${previewUrl}/preview?${params.toString()}`;
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPreviewUrl(e.target.value);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load preview. Make sure the remote app is running.');
  };

  return (
    <Box className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <Flex justify="between" align="center">
          <Text size="4" weight="medium">
            Live Preview
          </Text>
          <Flex gap="2" align="center">
            <Input
              placeholder="Remote app URL"
              value={previewUrl}
              onChange={handleUrlChange}
              className={styles.urlInput}
            />
            <Button size="sm" variant="ghost" onClick={handleRefresh}>
              🔄 Refresh
            </Button>
          </Flex>
        </Flex>

        <Text size="2" color="gray">
          Content API: /api/content/{contentType}s/{contentId}
        </Text>
      </div>

      <div className={styles.previewFrame}>
        {isLoading && (
          <div className={styles.previewLoading}>
            <Text size="3">Loading preview...</Text>
            <Text size="2" color="gray">
              Make sure your remote app is running on {previewUrl}
            </Text>
          </div>
        )}

        {error && (
          <div className={styles.previewError}>
            <Text size="3" color="red">
              {error}
            </Text>
            <Text size="2" color="gray">
              Check if the remote app is running and supports preview mode
            </Text>
          </div>
        )}

        <iframe
          src={getPreviewUrl()}
          className={styles.iframe}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={`${contentType} preview`}
        />
      </div>

      <div className={styles.previewInfo}>
        <Text size="2" color="gray">
          Remote apps can consume content via REST API and render with their own design system.
        </Text>
      </div>
    </Box>
  );
};
