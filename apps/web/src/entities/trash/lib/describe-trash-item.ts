import { formatBytes, NodeType, type TrashItem } from "@cs/shared";

/** Вторая строка строки корзины: что это и сколько места освободит purge. */
export const describeTrashItem = (item: TrashItem): string =>
  item.type === NodeType.Folder
    ? `Папка · объектов: ${item.childCount} · ${formatBytes(item.size)}`
    : `Файл · ${formatBytes(item.size)}`;
