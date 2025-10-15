import type { Component, ControlInstance } from '../models';

export type ComponentLibraryProps = {
  components: Component[];
  selectedComponent?: Component | null;
  onAddComponent?: () => void;
  onEditComponent?: (component: Component) => void;
  onDeleteComponent?: (componentId: string) => void;
  onSelectComponent?: (component: Component) => void;
};

// Re-export shared types for convenience
export type { Component, ControlInstance };
