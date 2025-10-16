import type { Component } from '@repo/ui';

export type ComponentsPageProps = {
  initialComponents: Promise<Component[]>;
};
