import { Dialog } from '@radix-ui/themes';
import { ModalProps } from './Modal.model';
import styles from './Modal.module.scss';

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
