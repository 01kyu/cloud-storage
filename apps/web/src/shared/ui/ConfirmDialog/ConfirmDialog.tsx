"use client";

import type { ReactNode } from "react";

import { Button } from "../Button";
import { Modal, ModalClose, ModalContent } from "../Modal";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  tone = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) => (
  <Modal open={open} onOpenChange={onOpenChange}>
    <ModalContent
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <ModalClose asChild>
            <Button variant="secondary">{cancelLabel}</Button>
          </ModalClose>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  </Modal>
);
