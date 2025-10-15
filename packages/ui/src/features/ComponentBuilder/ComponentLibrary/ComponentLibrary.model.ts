import { Component } from '../models';

export type ComponentLibraryProps = {
  components: Component[];
  selectedComponent?: Component | null;
  onAddComponent?: () => void;
  onEditComponent?: (component: Component) => void;
  onDeleteComponent?: (componentId: string) => void;
  onSelectComponent?: (component: Component) => void;
};
