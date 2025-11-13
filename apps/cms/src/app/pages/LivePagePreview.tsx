'use client';

import { Box, Button, Flex, Select, Text } from '@repo/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PageContent, ViewMode } from '../../types/page';
import styles from './LivePagePreview.module.scss';

type LivePagePreviewProps = {
  pageId: string;
  pageContent: PageContent;
  onContentChange?: (content: PageContent) => void;
};

// Template for a simple React component that renders the page
const generatePreviewCode = (pageContent: PageContent) => {
  return `import React from 'react';

// Auto-generated preview component for page: ${pageContent.name || 'Untitled Page'}
const PagePreview = () => {
  const pageData = ${JSON.stringify(pageContent, null, 2)};
  
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '16px' }}>
        {pageData.name || 'Page Preview'}
      </h1>
      
      {pageData.description && (
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          {pageData.description}
        </p>
      )}
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {pageData.components?.map((component, index) => (
          <ComponentRenderer 
            key={component.id || index}
            component={component}
          />
        )) || <p style={{ color: '#9ca3af' }}>No components added yet</p>}
      </div>
      
      <div style={{ 
        marginTop: '32px', 
        padding: '16px', 
        background: '#f3f4f6', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <strong>Preview Data:</strong>
        <pre style={{ marginTop: '8px', overflow: 'auto' }}>
          {JSON.stringify(pageData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Component renderer that handles different component types
const ComponentRenderer = ({ component }) => {
  const baseStyle = {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: '#ffffff'
  };
  
  const getComponentStyle = (type) => {
    const styles = {
      'hero': { 
        ...baseStyle,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '48px 24px'
      },
      'header': { 
        ...baseStyle,
        background: '#1f2937', 
        color: 'white',
        padding: '12px 24px'
      },
      'text': { 
        ...baseStyle,
        background: '#f9fafb'
      },
      'image': { 
        ...baseStyle,
        background: '#f3f4f6',
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      'footer': { 
        ...baseStyle,
        background: '#374151', 
        color: 'white'
      }
    };
    return styles[type?.toLowerCase()] || baseStyle;
  };
  
  return (
    <div style={getComponentStyle(component.type)}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
        {component.type || 'Component'}
      </div>
      <div style={{ fontSize: '12px', opacity: 0.8 }}>
        Config: {JSON.stringify(component.config || {}, null, 1)}
      </div>
    </div>
  );
};

export default PagePreview;`;
};

export const LivePagePreview = ({ pageContent }: LivePagePreviewProps) => {
  const [code, setCode] = useState(generatePreviewCode(pageContent));
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update code when page content changes
  useEffect(() => {
    setCode(generatePreviewCode(pageContent));
  }, [pageContent]);

  // Create the preview HTML document
  const createPreviewDocument = useCallback(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Page Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #ffffff;
    }
    #root {
      min-height: 100vh;
    }
    .error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 20px;
      margin: 20px;
      border-radius: 8px;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${code}
      
      const { createRoot } = ReactDOM;
      const root = createRoot(document.getElementById('root'));
      root.render(React.createElement(PagePreview));
    } catch (error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = 'Error rendering preview:\\n' + error.message;
      document.getElementById('root').appendChild(errorDiv);
      console.error('Preview error:', error);
    }
  </script>
</body>
</html>`;
  }, [code]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);

    if (iframeRef.current) {
      const doc = createPreviewDocument();
      const blob = new Blob([doc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setIsLoading(false);
      }, 1000);
    }
  }, [createPreviewDocument]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const getViewModeOptions = () => [
    { label: 'Split View', value: 'split' },
    { label: 'Preview Only', value: 'preview' },
    { label: 'Code Only', value: 'code' },
  ];

  // Auto-refresh on code change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRefresh();
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timer);
  }, [code, handleRefresh]);

  return (
    <Box className={styles.livePreview}>
      {/* Header */}
      <div className={styles.header}>
        <Flex justify="between" align="center">
          <Text size="4" weight="medium">
            📱 Live Page Preview
          </Text>
          <Flex gap="3" align="center">
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              options={getViewModeOptions()}
            />
            <Button size="sm" variant="ghost" onClick={handleRefresh}>
              🔄 Refresh
            </Button>
          </Flex>
        </Flex>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {viewMode === 'split' && (
          <>
            {/* Code Editor */}
            <div className={styles.codePanel}>
              <div className={styles.panelHeader}>
                <Text size="2" weight="medium">
                  React Component Code
                </Text>
              </div>
              <textarea
                className={styles.codeEditor}
                value={code}
                onChange={handleCodeChange}
                spellCheck={false}
                placeholder="Edit the React component code..."
              />
            </div>

            {/* Preview */}
            <div className={styles.previewPanel}>
              <div className={styles.panelHeader}>
                <Text size="2" weight="medium">
                  Live Preview
                </Text>
                {isLoading && (
                  <Text size="1" color="gray">
                    Loading...
                  </Text>
                )}
              </div>
              <iframe ref={iframeRef} className={styles.previewFrame} title="Live Preview" />
            </div>
          </>
        )}

        {viewMode === 'code' && (
          <div className={styles.fullPanel}>
            <div className={styles.panelHeader}>
              <Text size="2" weight="medium">
                React Component Code
              </Text>
            </div>
            <textarea
              className={styles.codeEditor}
              value={code}
              onChange={handleCodeChange}
              spellCheck={false}
              placeholder="Edit the React component code..."
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className={styles.fullPanel}>
            <div className={styles.panelHeader}>
              <Text size="2" weight="medium">
                Live Preview
              </Text>
              {isLoading && (
                <Text size="1" color="gray">
                  Loading...
                </Text>
              )}
            </div>
            <iframe ref={iframeRef} className={styles.previewFrame} title="Live Preview" />
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <Text size="2" color="red">
            Error: {error}
          </Text>
        </div>
      )}
    </Box>
  );
};
