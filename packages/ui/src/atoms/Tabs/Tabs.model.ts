export type TabsProps = {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
};

export type TabItem = {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
};
