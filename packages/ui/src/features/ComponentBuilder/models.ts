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
