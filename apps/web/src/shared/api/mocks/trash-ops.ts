import { NodeType, type FileItem, type Folder, type Node, type TrashItem } from "@cs/shared";

import { findFolder, getDb, refreshDb } from "./db";
import { isNameTaken, parentIdOf } from "./node-ops";

/** Корзина от свежих удалений к старым — как в UI. */
const trashItems = (): TrashItem[] =>
  [...getDb().trash].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));

/**
 * Список корзины — только корни удалений: содержимое удалённой папки не
 * показывается отдельными строками, ведь restore/purge всё равно работают
 * с поддеревом целиком.
 */
export const trashRoots = (): TrashItem[] => {
  const trashedFolderIds = new Set(
    getDb()
      .trash.filter((item) => item.type === NodeType.Folder)
      .map((item) => item.id),
  );

  return trashItems().filter((item) => {
    const parentId = parentIdOf(item);

    return parentId === null || !trashedFolderIds.has(parentId);
  });
};

/**
 * Удалённая папка уносит в корзину всё поддерево сразу, поэтому `path` папок и
 * `folderId` файлов — достаточный ключ: элементы с тем же префиксом удалены вместе с ней.
 */
export const trashSubtree = (item: TrashItem): TrashItem[] => {
  if (item.type !== NodeType.Folder) {
    return [item];
  }

  const trash = getDb().trash;
  const folderIds = new Set(
    trash
      .filter(
        (trashItem) => trashItem.type === NodeType.Folder && trashItem.path.startsWith(item.path),
      )
      .map((trashItem) => trashItem.id),
  );

  return trash.filter((trashItem) =>
    trashItem.type === NodeType.Folder
      ? folderIds.has(trashItem.id)
      : trashItem.folderId !== null && folderIds.has(trashItem.folderId),
  );
};

const withoutDeletedAt = <T extends TrashItem>(item: T): Omit<T, "deletedAt"> => {
  const { deletedAt: _deletedAt, ...rest } = item;

  return rest;
};

export type RestoreMockNodeResult =
  { ok: true; node: Node } | { ok: false; reason: "not-found" | "duplicate" };

/**
 * Возвращает узел (для папки — всё поддерево) из корзины. Если исходной папки
 * больше нет, объект восстанавливается в корень — как «lost+found» бэкенда (B3).
 * Имя проверяется тем же правилом, что и при создании: 409 вместо тихого дубликата.
 */
export const restoreMockNode = (nodeId: string): RestoreMockNodeResult => {
  const current = getDb();
  const item = current.trash.find((trashItem) => trashItem.id === nodeId);

  if (!item) {
    return { ok: false, reason: "not-found" };
  }

  const originalParentId = parentIdOf(item);
  const targetParentId = originalParentId && findFolder(originalParentId) ? originalParentId : null;

  if (isNameTaken(targetParentId, item.name, item.id)) {
    return { ok: false, reason: "duplicate" };
  }

  const subtree = trashSubtree(item);
  const subtreeIds = new Set(subtree.map((trashItem) => trashItem.id));
  const parent = targetParentId ? findFolder(targetParentId) : undefined;
  const targetPath = parent ? parent.path : "/";
  const targetDepth = parent ? parent.depth + 1 : 0;
  /** У файла нет `path`/`depth`, поэтому смещение поддерева считается только для папки. */
  const folderRoot = item.type === NodeType.Folder ? item : null;
  const subtreePath = folderRoot ? `${targetPath}${folderRoot.id}/` : targetPath;
  const depthDelta = folderRoot ? targetDepth - folderRoot.depth : 0;

  current.trash = current.trash.filter((trashItem) => !subtreeIds.has(trashItem.id));

  subtree.forEach((trashItem) => {
    if (trashItem.type === NodeType.Folder) {
      const isRoot = trashItem.id === item.id;
      const path = isRoot
        ? `${targetPath}${trashItem.id}/`
        : `${subtreePath}${trashItem.path.slice(folderRoot?.path.length ?? 0)}`;
      const folder: Folder = {
        ...withoutDeletedAt(trashItem),
        parentId: isRoot ? targetParentId : trashItem.parentId,
        path,
        depth: isRoot ? targetDepth : trashItem.depth + depthDelta,
      };

      current.folders.push(folder);

      return;
    }

    const file: FileItem = {
      ...withoutDeletedAt(trashItem),
      folderId:
        trashItem.folderId && (subtreeIds.has(trashItem.folderId) || findFolder(trashItem.folderId))
          ? trashItem.folderId
          : null,
    };

    current.files.push(file);
  });

  refreshDb();

  const restored = [...current.folders, ...current.files].find((node) => node.id === nodeId);

  return restored ? { ok: true, node: restored } : { ok: false, reason: "not-found" };
};

const removeFromTrash = (nodeIds: string[]): number => {
  const current = getDb();
  const removedIds = new Set<string>();

  nodeIds.forEach((nodeId) => {
    const item = current.trash.find((trashItem) => trashItem.id === nodeId);

    if (!item) {
      return;
    }

    trashSubtree(item).forEach((trashItem) => {
      removedIds.add(trashItem.id);
    });
  });

  current.trash = current.trash.filter((item) => !removedIds.has(item.id));
  refreshDb();

  return removedIds.size;
};

/** Окончательное удаление: квота пересчитывается в `refreshDb` и освобождается. */
export const purgeMockNodes = (nodeIds: string[]): number => removeFromTrash(nodeIds);
