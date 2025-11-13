import type { ComponentInstance } from '@repo/ui';
import { useState } from 'react';

export const useComponentAuthoring = () => {
  const [editingInstance, setEditingInstance] = useState<ComponentInstance | null>(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);

  const handleInstanceClick = (instance: ComponentInstance) => {
    setEditingInstance(instance);
    setIsAuthoringOpen(true);
  };

  const handleAuthoringClose = () => {
    setEditingInstance(null);
    setIsAuthoringOpen(false);
  };

  return {
    editingInstance,
    isAuthoringOpen,
    setIsAuthoringOpen,
    handleInstanceClick,
    handleAuthoringClose,
  };
};
