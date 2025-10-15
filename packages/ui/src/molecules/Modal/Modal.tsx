import { Dialog } from '@radix-ui/themes';
import { ReactNode } from 'react';
import styles from './Modal.module.scss';

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export const Modal = ({ open, onOpenChange, title, children }: ModalProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className={styles.content}>
        <Dialog.Title className={styles.title}>{title}</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
};
