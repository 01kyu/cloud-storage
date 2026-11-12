"use client";

import { RotateCcw } from "lucide-react";

import { useRestoreNodeMutation } from "@entities/trash";
import { Button, showErrorToast, showSuccessToast } from "@shared/ui";

export type RestoreSelectedButtonProps = {
  ids: string[];
  /** Вызывается после прохода: вызывающий очищает выбор и обновляет список. */
  onRestored: () => void;
};

/**
 * Восстановление пачкой — это N независимых `POST /trash/:id/restore`:
 * контракт массового восстановления не заводим, а частичный успех показываем
 * двумя тостами (сколько прошло, сколько нет). Квота и конфликты имён
 * проверяются на каждом объекте, поэтому одна ошибка не отменяет остальные.
 */
export const RestoreSelectedButton = ({ ids, onRestored }: RestoreSelectedButtonProps) => {
  const [restoreNode, { isLoading }] = useRestoreNodeMutation();

  const handleRestore = async (): Promise<void> => {
    let restored = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await restoreNode(id).unwrap();
        restored += 1;
      } catch {
        failed += 1;
      }
    }

    if (restored > 0) {
      showSuccessToast(`Восстановлено объектов: ${restored}`);
    }

    if (failed > 0) {
      showErrorToast(`Не удалось восстановить объектов: ${failed}`);
    }

    onRestored();
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      iconLeft={<RotateCcw size={14} aria-hidden="true" />}
      loading={isLoading}
      onClick={() => void handleRestore()}
    >
      {`Восстановить (${ids.length})`}
    </Button>
  );
};
