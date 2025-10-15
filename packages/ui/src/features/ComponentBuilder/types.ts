export enum ComponentType {
  PRIMITIVE = 'primitive',
  USER_DEFINED = 'user-defined',
}

export const COMPONENT_TYPE_VALUES = [ComponentType.PRIMITIVE, ComponentType.USER_DEFINED] as const;
