"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";

import { cn } from "@shared/lib";

import styles from "./Modal.module.scss";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;
export const ModalTitle = Dialog.Title;
export const ModalDescription = Dialog.Description;

export type ModalContentProps = Omit<ComponentPropsWithRef<typeof Dialog.Content>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  hideCloseButton?: boolean;
};

export const ModalContent = ({
  title,
  description,
  footer,
  size = "md",
  hideCloseButton = false,
  className,
  children,
  ...props
}: ModalContentProps) => (
  <Dialog.Portal>
    <Dialog.Overlay className={styles.overlay} />
    <Dialog.Content className={cn(styles.content, styles[size], className)} {...props}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          ) : null}
        </div>
        {hideCloseButton ? null : (
          <Dialog.Close className={styles.close} aria-label="Закрыть">
            <X size={18} aria-hidden="true" />
          </Dialog.Close>
        )}
      </header>
      <div className={styles.body}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </Dialog.Content>
  </Dialog.Portal>
);
