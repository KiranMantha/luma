'use client';

import { useState } from 'react';
import { FRAMEWORK_LABELS, Framework, getSnippet } from './snippets';
import styles from './SettingsPage.module.scss';

export const SnippetGenerator = () => {
  const [framework, setFramework] = useState<Framework>('react');
  const [copied, setCopied] = useState(false);

  const snippet = getSnippet(framework);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.snippetGenerator}>
      <p className={styles.snippetDescription}>
        Copy the snippet for your framework, drop it into your project as a single file, and follow
        the inline comments. No external dependencies required.
      </p>

      <div className={styles.frameworkTabs}>
        {(Object.keys(FRAMEWORK_LABELS) as Framework[]).map((fw) => (
          <button
            key={fw}
            onClick={() => setFramework(fw)}
            className={`${styles.frameworkTab} ${framework === fw ? styles.frameworkTabActive : ''}`}
          >
            {FRAMEWORK_LABELS[fw]}
          </button>
        ))}
      </div>

      <div className={styles.snippetContainer}>
        <div className={styles.snippetHeader}>
          <span className={styles.snippetLabel}>{FRAMEWORK_LABELS[framework]} — luma-preview.ts</span>
          <button onClick={handleCopy} className={styles.copyButton}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className={styles.snippetCode}>
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  );
};
