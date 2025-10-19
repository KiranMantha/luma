import { ControlType } from './ComponentPreview/ComponentPreview.model';

export enum ComponentType {
  PRIMITIVE = 'primitive',
  USER_DEFINED = 'user-defined',
}

export const COMPONENT_TYPE_VALUES = [ComponentType.PRIMITIVE, ComponentType.USER_DEFINED] as const;

export type ControlInstance = {
  id: string;
  controlType: ControlType;
  label?: string;
  config: Record<string, unknown>;
  order: number;
};

export type Component = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  type: ComponentType;
  isPrimitive?: boolean;
  controls?: ControlInstance[];
};

// Component instance placed on a page/template with specific configuration
export type ComponentInstance = {
  id: string; // Unique instance ID
  componentId: string; // Reference to the component definition
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  config: Record<string, unknown>; // Instance-specific configuration/content
  order: number; // Z-index or layout order
};

// Template defines reusable page layouts
export type Template = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  componentInstances: ComponentInstance[];
  metadata?: {
    thumbnail?: string;
    tags?: string[];
  };
};

// Page inherits from template and can add/modify components
export type Page = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  status: PageStatus;
  folderId?: string; // For organization
  templateId?: string; // Optional template inheritance
  componentInstances: ComponentInstance[];
  metadata?: {
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    tags?: string[];
  };
};

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Folder for organizing pages
export type Folder = {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For nested folders
  createdAt: string;
  updatedAt: string;
};
