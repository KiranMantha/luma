'use client';

import { Box, Button, Card, Flex, Text } from '@repo/ui';
import { useState } from 'react';
import { LivePagePreview } from './LivePagePreview';
import styles from './PagesPage.module.scss';

// Mock page data - in real implementation, this would come from API
const mockPages = [
  {
    id: 'page-1',
    name: 'Home Page',
    description: 'Main landing page',
    status: 'published' as const,
    lastModified: '2024-01-15',
    components: [
      {
        id: 'comp-1',
        componentId: 'hero',
        name: 'Hero Section',
        props: { title: 'Welcome to Our Site', subtitle: 'Beautiful experiences await' },
      },
      {
        id: 'comp-2',
        componentId: 'text',
        name: 'Content Block',
        props: { content: 'This is the main content area with important information.' },
      },
    ],
    metadata: { slug: 'home' },
  },
  {
    id: 'page-2',
    name: 'About Us',
    description: 'Company information page',
    status: 'draft' as const,
    lastModified: '2024-01-14',
    components: [
      {
        id: 'comp-3',
        componentId: 'header',
        name: 'Page Header',
        props: { title: 'About Our Company' },
      },
      {
        id: 'comp-4',
        componentId: 'text',
        name: 'Content Text',
        props: { content: 'We are a innovative company focused on creating amazing experiences.' },
      },
    ],
    metadata: { slug: 'about' },
  },
  {
    id: 'page-3',
    name: 'Contact',
    description: 'Contact information and form',
    status: 'published' as const,
    lastModified: '2024-01-13',
    components: [
      {
        id: 'comp-6',
        componentId: 'header',
        name: 'Contact Header',
        props: { title: 'Get In Touch' },
      },
      {
        id: 'comp-7',
        componentId: 'text',
        name: 'Contact Text',
        props: { content: "We'd love to hear from you. Send us a message!" },
      },
    ],
    metadata: { slug: 'contact' },
  },
];

export default function PagesPageClient() {
  const [pages] = useState(mockPages);
  const [selectedPage, setSelectedPage] = useState<(typeof mockPages)[0] | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handlePageSelect = (page: (typeof mockPages)[0]) => {
    setSelectedPage(page);
    setIsPreviewMode(false);
  };

  const handlePreviewPage = (page: (typeof mockPages)[0]) => {
    setSelectedPage(page);
    setIsPreviewMode(true);
  };

  const handleClosePreview = () => {
    setSelectedPage(null);
    setIsPreviewMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600';
      case 'draft':
        return 'text-yellow-600';
      case 'archived':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  // Show live preview if a page is selected for preview
  if (isPreviewMode && selectedPage) {
    return (
      <Box className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <Flex justify="between" align="center">
            <div>
              <Text size="5" weight="bold">
                Live Preview: {selectedPage.name}
              </Text>
              <Text size="2" color="gray">
                StackBlitz-style live editor with real-time preview
              </Text>
            </div>
            <Button variant="ghost" onClick={handleClosePreview}>
              ← Back to Pages
            </Button>
          </Flex>
        </div>

        <LivePagePreview
          pageId={selectedPage.id}
          pageContent={selectedPage as any}
          onContentChange={(updatedContent) => {
            // In real implementation, this would save to API
            console.log('Content updated:', updatedContent);
          }}
        />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <Flex justify="between" align="center" className="mb-4">
        <div>
          <Text size="7" weight="bold">
            Pages
          </Text>
          <Text size="2" color="gray">
            Create and manage your content pages with live preview
          </Text>
        </div>
        <Button variant="primary">New Page</Button>
      </Flex>

      <Box className="mb-6">
        <Text size="3" weight="medium" className="mb-2">
          📱 Live Preview Feature
        </Text>
        <Text size="2" color="gray" className="mb-4">
          Click &ldquo;Live Preview&rdquo; on any page to see a StackBlitz-style editor with real-time React component
          rendering.
        </Text>
      </Box>

      <Box>
        {pages.length === 0 ? (
          <Text color="gray">No pages yet. Create your first page.</Text>
        ) : (
          <div className={styles.pagesList}>
            {pages.map((page) => (
              <Card key={page.id} className={styles.pageCard}>
                <Flex direction="column" gap="3">
                  <div>
                    <Flex justify="between" align="start" className="mb-2">
                      <Text size="4" weight="medium">
                        {page.name}
                      </Text>
                      <span className={`text-sm font-medium ${getStatusColor(page.status)}`}>● {page.status}</span>
                    </Flex>

                    {page.description && (
                      <Text size="2" color="gray" className="mb-2">
                        {page.description}
                      </Text>
                    )}

                    <Text size="1" color="gray">
                      {page.components?.length || 0} components • Slug: /{page.metadata.slug}
                    </Text>
                  </div>

                  <Flex gap="2" justify="end">
                    <Button size="sm" variant="primary" onClick={() => handlePreviewPage(page)}>
                      📱 Live Preview
                    </Button>
                    <Button size="sm" variant="primary-outline" onClick={() => handlePageSelect(page)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="primary-outline" color="red">
                      Delete
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </div>
        )}
      </Box>
    </Box>
  );
}
