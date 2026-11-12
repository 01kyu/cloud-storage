"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { TrashItem } from "@cs/shared";
import { usePurgeTrashMutation } from "@entities/trash";
import { getApiErrorMessage } from "@shared/lib";
import { Button, ConfirmDialog, showErrorToast, showSuccessToast } from "@shared/ui";

/** Контракт `purgeTrashPayloadSchema` ограничивает пачку сотней id. */
const PURGE_CHUNK_SIZE = 100;

export type PurgeAllButtonProps = {
  items: TrashItem[];
};

/** Чистит корзину пачками: список длиннее 100 элементов не пройдёт валидацию. */
export const PurgeAllButton = ({ items }: PurgeAllButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [purgeTrash, { isLoading }] = usePurgeTrashMutation();

  const handleConfirm = async (): Promise<void> => {
    const ids = items.map((item) => item.id);

    try {
      for (let offset = 0; offset < ids.length; offset += PURGE_CHUNK_SIZE) {
        await purgeTrash({ ids: ids.slice(offset, offset + PURGE_CHUNK_SIZE) }).unwrap();
      }

      showSuccessToast("Корзина очищена");
      setIsOpen(false);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Не удалось очистить корзину. Попробуйте ещё раз"));
    }
  };

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        iconLeft={<Trash2 size={14} aria-hidden="true" />}
        disabled={items.length === 0}
        onClick={() => setIsOpen(true)}
      >
        Очистить корзину
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        tone="danger"
        title="Очистить корзину?"
        description="Все объекты будут удалены без возможности восстановления."
        confirmLabel="Очистить"
        loading={isLoading}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};
