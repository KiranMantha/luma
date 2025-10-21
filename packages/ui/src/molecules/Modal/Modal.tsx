import { Box } from '#atoms';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { clsx } from 'clsx';
import { Fragment } from 'react';
import { ModalProps } from './Modal.model';
import styles from './Modal.module.scss';

export const Modal = ({ open, onOpenChange, title, children, size = 'md' }: ModalProps) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className={styles.modal} onClose={() => onOpenChange(false)}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center bg-black/30 p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel
                className={clsx(
                  'w-full transform overflow-hidden rounded-md bg-white text-left align-middle shadow-xl transition-all',
                  sizeClasses[size],
                )}
              >
                <DialogTitle as="h3" className={styles.title}>
                  {title}
                </DialogTitle>
                <Box className="p-4">{children}</Box>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
