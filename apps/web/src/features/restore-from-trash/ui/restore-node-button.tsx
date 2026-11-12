"use client";

import { RotateCcw } from "lucide-react";

import type { TrashItem } from "@cs/shared";
import { useRestoreNodeMutation } from "@entities/trash";
import { getApiErrorMessage } from "@shared/lib";
import { Button, showErrorToast, showSuccessToast } from "@shared/ui";

export type RestoreNodeButtonProps = {
  item: TrashItem;
};

/**
 * Восстановление возвращает узел на прежнее место, а если папки уже нет — в корень.
 * Об успехе и ошибке сообщают тосты: строка корзины исчезает из списка сама.
 */
export const RestoreNodeButton = ({ item }: RestoreNodeButtonProps) => {
  const [restoreNode, { isLoading }] = useRestoreNodeMutation();

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreNode(item.id).unwrap();
      showSuccessToast(`Восстановлено: «${item.name}»`);
    } catch (error) {
      showErrorToast(
        getApiErrorMessage(error, "Не удалось восстановить объект. Попробуйте ещё раз"),
      );
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      iconLeft={<RotateCcw size={14} aria-hidden="true" />}
      loading={isLoading}
      onClick={() => void handleRestore()}
    >
      Восстановить
    </Button>
  );
};
