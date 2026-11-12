"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { TrashItem } from "@cs/shared";
import { usePurgeNodeMutation } from "@entities/trash";
import { getApiErrorMessage } from "@shared/lib";
import { Button, ConfirmDialog, showErrorToast, showSuccessToast } from "@shared/ui";

export type PurgeNodeButtonProps = {
  item: TrashItem;
};

/** Окончательное удаление спрашивает подтверждение: отменить его нельзя. */
export const PurgeNodeButton = ({ item }: PurgeNodeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [purgeNode, { isLoading }] = usePurgeNodeMutation();

  const handleConfirm = async (): Promise<void> => {
    try {
      await purgeNode(item.id).unwrap();
      showSuccessToast(`Удалено навсегда: «${item.name}»`);
      setIsOpen(false);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Не удалось удалить объект. Попробуйте ещё раз"));
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        iconLeft={<Trash2 size={14} aria-hidden="true" />}
        onClick={() => setIsOpen(true)}
      >
        Удалить навсегда
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        tone="danger"
        title="Удалить навсегда?"
        description={`«${item.name}» будет удалён без возможности восстановления.`}
        confirmLabel="Удалить"
        loading={isLoading}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};
