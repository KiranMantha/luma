import { ComponentSection } from '../models';

export const DEFAULT_SECTION_NAME = 'General';

/**
 * Gets the total count of controls across all sections
 */
export const getTotalControlsCount = (sections: ComponentSection[]): number => {
  return sections.reduce((total, section) => total + section.controls.length, 0);
};

/**
 * Finds which section contains a specific control
 */
export const findSectionByControlId = (
  sections: ComponentSection[],
  controlId: string,
): ComponentSection | undefined => {
  return sections.find((section) => section.controls.some((control) => control.id === controlId));
};
