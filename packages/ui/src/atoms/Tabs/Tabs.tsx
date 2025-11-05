'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { TabsProps } from './Tabs.model';
import styles from './Tabs.module.scss';

export const Tabs = ({ tabs, defaultTab, activeTab, onTabChange, className }: TabsProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || defaultTab || tabs[0]?.id || '');

  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (tabs.find((tab) => tab.id === tabId)?.disabled) return;

    if (activeTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === currentActiveTab)?.content;

  return (
    <div className={clsx(styles.tabs, className)}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={currentActiveTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            disabled={tab.disabled}
            className={clsx(styles.tab, currentActiveTab === tab.id && styles.active, tab.disabled && styles.disabled)}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabPanels}>
        <div
          id={`panel-${currentActiveTab}`}
          role="tabpanel"
          aria-labelledby={currentActiveTab}
          className={styles.tabPanel}
        >
          {activeTabContent}
        </div>
      </div>
    </div>
  );
};
