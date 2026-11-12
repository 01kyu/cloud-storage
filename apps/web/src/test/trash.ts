import type { TrashItem } from "@cs/shared";
import { API_BASE_PATH } from "@cs/shared";
import { getDb } from "@shared/api/mocks";

/** Кладём узел в корзину настоящим запросом: моки и UI проверяются вместе. */
export const moveToTrash = async (path: string): Promise<void> => {
  const response = await fetch(`${window.location.origin}${API_BASE_PATH}${path}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Не удалось удалить объект: ${response.status}`);
  }
};

/** Элемент корзины для рендера фич restore/purge. */
export const getTrashItem = (nodeId: string): TrashItem => {
  const item = getDb().trash.find((trashItem) => trashItem.id === nodeId);

  if (!item) {
    throw new Error(`Элемент ${nodeId} не найден в корзине мока`);
  }

  return item;
};
