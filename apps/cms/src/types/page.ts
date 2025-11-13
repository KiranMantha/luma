// Page-related TypeScript interfaces

export interface PageContent {
  id: string;
  name: string;
  description?: string;
  template?: {
    id: string;
    name: string;
    zones: ZoneContent[];
  };
  components: ComponentInstance[];
  metadata?: Record<string, any>;
  status: 'draft' | 'published';
  lastModified: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface ZoneContent {
  id: string;
  name: string;
  type: 'header' | 'hero' | 'content' | 'sidebar' | 'footer';
  components: ComponentInstance[];
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  name: string;
  props: Record<string, any>;
  children?: ComponentInstance[];
}

export interface Page {
  id: string;
  name: string;
  status: 'draft' | 'published';
  lastModified: string;
  templateId?: string;
  description?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface Folder {
  id: string;
  name: string;
  isExpanded?: boolean;
  children: (Folder | Page)[];
}

export type ViewMode = 'split' | 'preview' | 'code';
