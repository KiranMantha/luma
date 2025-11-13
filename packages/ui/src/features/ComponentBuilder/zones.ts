// Template Zone System - Our USP combining best of Strapi & AEM

import type { ComponentInstance } from './models';

export type ZoneType = 'header' | 'hero' | 'content' | 'sidebar' | 'footer' | 'custom';

export type ZonePolicy = {
  allowedComponents: string[]; // Deprecated - kept for backward compatibility, no longer enforced
  maxComponents?: number; // Maximum number of components allowed
  required?: boolean; // Zone must have at least one component
  locked?: boolean; // Zone cannot be modified (for template inheritance)
};

export type TemplateZone = {
  id: string;
  type: ZoneType;
  name: string;
  description?: string;
  policy: ZonePolicy;
  componentInstances: ComponentInstance[];
  order: number; // Display order in template
  gridArea?: string; // CSS Grid area for layout
};

// Predefined zone configurations with user-friendly defaults
export const DEFAULT_ZONE_POLICIES: Record<ZoneType, ZonePolicy> = {
  header: {
    allowedComponents: [], // Users can place any component they want
    maxComponents: 1, // Single component for clean header design
    required: false,
  },
  hero: {
    allowedComponents: [], // Users decide what goes in hero section
    maxComponents: 3, // Allow multiple hero elements if needed
    required: false,
  },
  content: {
    allowedComponents: [], // Complete freedom for main content
    required: false, // Let users decide if content is required
  },
  sidebar: {
    allowedComponents: [], // Any component can be sidebar content
    maxComponents: 10,
    required: false,
  },
  footer: {
    allowedComponents: [], // Complete freedom for footer content
    maxComponents: 1, // Single component for clean footer design
    required: false,
  },
  custom: {
    allowedComponents: [], // Ultimate flexibility
    required: false,
  },
};

// Common template layouts
export const TEMPLATE_LAYOUTS = {
  'header-footer': {
    gridTemplateAreas: '"header" "body" "footer"',
    gridTemplateRows: 'auto 1fr auto',
    zones: ['header', 'footer'] as ZoneType[],
  },
} as const;

export type TemplateLayout = keyof typeof TEMPLATE_LAYOUTS;

// Helper function to create default zones for a layout
export function createDefaultZones(layout: TemplateLayout): TemplateZone[] {
  const layoutConfig = TEMPLATE_LAYOUTS[layout];

  // Map zone types to user-friendly names
  const zoneDisplayNames: Record<ZoneType, string> = {
    header: 'Header',
    hero: 'Hero Section',
    content: 'Body',
    sidebar: 'Sidebar',
    footer: 'Footer',
    custom: 'Custom',
  };

  if (layout === 'header-footer') {
    return [
      {
        id: 'zone-header-0',
        type: 'header' as ZoneType,
        name: 'Header',
        description: 'Top section - add any components like navigation, logo, search, etc.',
        policy: { ...DEFAULT_ZONE_POLICIES.header },
        componentInstances: [],
        order: 0,
        gridArea: 'header',
      },
      {
        id: 'zone-body-placeholder',
        type: 'custom' as ZoneType,
        name: 'Body',
        description: 'Main content area - managed by individual pages',
        policy: { allowedComponents: [], maxComponents: 0, locked: true },
        componentInstances: [],
        order: 1,
        gridArea: 'body',
      },
      {
        id: 'zone-footer-1',
        type: 'footer' as ZoneType,
        name: 'Footer',
        description: 'Bottom section - add any components like links, copyright, social media, etc.',
        policy: { ...DEFAULT_ZONE_POLICIES.footer },
        componentInstances: [],
        order: 2,
        gridArea: 'footer',
      },
    ];
  }

  // Default behavior for other layouts
  return layoutConfig.zones.map((zoneType, index) => ({
    id: `zone-${zoneType}-${index}`,
    type: zoneType,
    name: zoneDisplayNames[zoneType],
    description:
      zoneType === 'header'
        ? 'Site header with navigation and branding'
        : zoneType === 'footer'
          ? 'Site footer with links and information'
          : undefined,
    policy: { ...DEFAULT_ZONE_POLICIES[zoneType] },
    componentInstances: [],
    order: index,
    gridArea: zoneType,
  }));
}

// Create default zones for pages (single body zone)
export function createDefaultPageZones(): TemplateZone[] {
  return [
    {
      id: 'body',
      type: 'content',
      name: 'Body',
      description: 'Main content area for page components',
      policy: {
        allowedComponents: [], // Complete freedom for page content
        maxComponents: undefined, // No limit on components
        required: false,
        locked: false,
      },
      componentInstances: [],
      order: 0,
      gridArea: 'body',
    },
  ];
}

// Validation helpers
export function validateZonePlacement(
  zoneType: ZoneType,
  componentId: string,
  currentCount: number,
): { valid: boolean; reason?: string } {
  const policy = DEFAULT_ZONE_POLICIES[zoneType];

  // Skip component ID validation - users should be free to name components whatever they want
  // The zone system provides semantic organization, not restrictive validation

  // Only check if the zone is locked (like the body placeholder)
  if (policy.locked) {
    return {
      valid: false,
      reason: `This zone is locked and cannot accept components`,
    };
  }

  // Check max components limit
  if (policy.maxComponents && currentCount >= policy.maxComponents) {
    return {
      valid: false,
      reason: `Maximum ${policy.maxComponents} components allowed in ${zoneType} zone`,
    };
  }

  return { valid: true };
}
