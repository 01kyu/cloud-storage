"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { usePurgeTrashMutation } from "@entities/trash";
import { getApiErrorMessage } from "@shared/lib";
import { Button, ConfirmDialog, showErrorToast, showSuccessToast } from "@shared/ui";

/** Контракт `purgeTrashPayloadSchema` ограничивает пачку сотней id. */
const PURGE_CHUNK_SIZE = 100;

export type PurgeSelectedButtonProps = {
  ids: string[];
  /** Вызывается после прохода: вызывающий очищает выбор и обновляет список. */
  onPurged: () => void;
};

/**
 * Массовое удаление идёт через `POST /trash/purge` пачками по 100:
 * одна операция на пачку, а не запрос на каждый объект.
 */
export const PurgeSelectedButton = ({ ids, onPurged }: PurgeSelectedButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [purgeTrash, { isLoading }] = usePurgeTrashMutation();

  const handleConfirm = async (): Promise<void> => {
    try {
      for (let offset = 0; offset < ids.length; offset += PURGE_CHUNK_SIZE) {
        await purgeTrash({ ids: ids.slice(offset, offset + PURGE_CHUNK_SIZE) }).unwrap();
      }

      showSuccessToast(`Удалено навсегда объектов: ${ids.length}`);
      setIsOpen(false);
      onPurged();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Не удалось удалить объекты. Попробуйте ещё раз"));
    }
  };

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        iconLeft={<Trash2 size={14} aria-hidden="true" />}
        onClick={() => setIsOpen(true)}
      >
        {`Удалить (${ids.length})`}
      </Button>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        tone="danger"
        title="Удалить выбранные?"
        description={`Объектов: ${ids.length}. Восстановить их будет нельзя.`}
        confirmLabel="Удалить"
        loading={isLoading}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
};
