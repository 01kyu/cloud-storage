import {
  FileStatus,
  LIMITS,
  NodeType,
  type FileItem,
  type Node,
  type TrashItem,
  type UploadInitPayload,
} from "@cs/shared";

import { findFile, findFolder, findNode, getDb, refreshDb, usedBytes } from "./db";
import { extensionOf, fileKindOf, mimeOf } from "./file-meta";

/** У папки `parentId`, у файла `folderId`. */
export const parentIdOf = (node: Node): string | null =>
  node.type === NodeType.Folder ? node.parentId : node.folderId;

const isSameName = (left: string, right: string): boolean =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

/** Имя занято в целевой папке? Та же проверка, что в unique-индексе `(owner, parent, lower(name))`. */
export const isNameTaken = (parentId: string | null, name: string, exceptId: string): boolean =>
  [...getDb().folders, ...getDb().files].some(
    (node) => node.id !== exceptId && parentIdOf(node) === parentId && isSameName(node.name, name),
  );

export type RenameMockNodeResult =
  { ok: true; node: Node } | { ok: false; reason: "not-found" | "duplicate" };

/** Расширение файла пересчитывается вместе с именем. */
export const renameMockNode = (nodeId: string, name: string): RenameMockNodeResult => {
  const node = findNode(nodeId);

  if (!node) {
    return { ok: false, reason: "not-found" };
  }

  if (isNameTaken(parentIdOf(node), name, node.id)) {
    return { ok: false, reason: "duplicate" };
  }

  const trimmed = name.trim();
  const updatedAt = new Date().toISOString();

  node.name = trimmed;
  node.updatedAt = updatedAt;

  if (node.type === NodeType.File) {
    node.extension = extensionOf(trimmed);
  }

  refreshDb();

  const renamed = findNode(nodeId);

  return renamed ? { ok: true, node: renamed } : { ok: false, reason: "not-found" };
};

export type MoveMockNodeResult =
  | { ok: true; node: Node }
  | { ok: false; reason: "not-found" | "target-not-found" | "duplicate" | "self-target" };

/** У папки пересчитываются `path` и `depth` всего поддерева. */
export const moveMockNode = (nodeId: string, targetFolderId: string | null): MoveMockNodeResult => {
  const node = findNode(nodeId);

  if (!node) {
    return { ok: false, reason: "not-found" };
  }

  const target = targetFolderId ? findFolder(targetFolderId) : undefined;

  if (targetFolderId && !target) {
    return { ok: false, reason: "target-not-found" };
  }

  if (node.type === NodeType.Folder && target && target.path.startsWith(node.path)) {
    return { ok: false, reason: "self-target" };
  }

  if (parentIdOf(node) === targetFolderId) {
    return { ok: true, node };
  }

  if (isNameTaken(targetFolderId, node.name, node.id)) {
    return { ok: false, reason: "duplicate" };
  }

  const updatedAt = new Date().toISOString();

  if (node.type === NodeType.Folder) {
    const oldPath = node.path;
    const newPath = `${target ? target.path : "/"}${node.id}/`;
    const depthDelta = (target ? target.depth + 1 : 0) - node.depth;

    node.parentId = targetFolderId;
    node.path = newPath;
    node.depth += depthDelta;
    node.updatedAt = updatedAt;

    getDb().folders.forEach((folder) => {
      if (folder.id !== node.id && folder.path.startsWith(oldPath)) {
        folder.path = `${newPath}${folder.path.slice(oldPath.length)}`;
        folder.depth += depthDelta;
      }
    });
  } else {
    node.folderId = targetFolderId;
    node.updatedAt = updatedAt;
  }

  refreshDb();

  const moved = findNode(nodeId);

  return moved ? { ok: true, node: moved } : { ok: false, reason: "not-found" };
};

/** Мягкое удаление: у папки в корзину попадает всё поддерево. */
export const deleteMockNode = (nodeId: string): boolean => {
  const node = findNode(nodeId);

  if (!node) {
    return false;
  }

  const current = getDb();
  const deletedAt = new Date().toISOString();
  const removed: TrashItem[] = [];

  if (node.type === NodeType.Folder) {
    const subtreeIds = new Set(
      current.folders
        .filter((folder) => folder.path.startsWith(node.path))
        .map((folder) => folder.id),
    );

    current.folders
      .filter((folder) => subtreeIds.has(folder.id))
      .forEach((folder) => removed.push({ ...folder, deletedAt }));

    current.files
      .filter((file) => file.folderId && subtreeIds.has(file.folderId))
      .forEach((file) => removed.push({ ...file, deletedAt }));

    current.folders = current.folders.filter((folder) => !subtreeIds.has(folder.id));
    current.files = current.files.filter(
      (file) => !(file.folderId && subtreeIds.has(file.folderId)),
    );
  } else {
    current.files = current.files.filter((file) => file.id !== node.id);
    removed.push({ ...node, deletedAt });
  }

  current.trash.push(...removed);
  refreshDb();

  return true;
};

export type CreateUploadResult =
  | { ok: true; file: FileItem }
  | { ok: false; reason: "folder-not-found" | "duplicate" | "too-large" | "quota-exceeded" };

/** Первый шаг загрузки: создаём файл в статусе `uploading` и проверяем лимиты. */
export const createUploadingFile = (payload: UploadInitPayload): CreateUploadResult => {
  const { name, folderId, size, mimeType } = payload;

  if (folderId && !findFolder(folderId)) {
    return { ok: false, reason: "folder-not-found" };
  }

  if (size > LIMITS.maxFileSizeBytes) {
    return { ok: false, reason: "too-large" };
  }

  if (usedBytes() + size > getDb().user.storageQuota) {
    return { ok: false, reason: "quota-exceeded" };
  }

  if (isNameTaken(folderId, name, "")) {
    return { ok: false, reason: "duplicate" };
  }

  const now = new Date().toISOString();
  const file: FileItem = {
    id: crypto.randomUUID(),
    type: NodeType.File,
    name: name.trim(),
    folderId,
    mimeType,
    extension: extensionOf(name),
    kind: fileKindOf(mimeType, name),
    size,
    status: FileStatus.Uploading,
    checksum: null,
    createdAt: now,
    updatedAt: now,
  };

  getDb().files.push(file);
  refreshDb();

  return { ok: true, file };
};

/** Второй шаг загрузки: файл становится `ready`, ему проставляется checksum. */
export const completeMockUpload = (fileId: string, checksum: string): FileItem | null => {
  const file = findFile(fileId);

  if (!file || file.status !== FileStatus.Uploading) {
    return null;
  }

  file.status = FileStatus.Ready;
  file.checksum = checksum;
  file.updatedAt = new Date().toISOString();
  refreshDb();

  return findFile(fileId) ?? null;
};

export type MockFileContent = { content: string; mimeType: string };

/** «Смета.xlsx» → база «Смета» и расширение «.xlsx» (с точкой). */
const splitFileName = (name: string): { base: string; extension: string } => {
  const dot = name.lastIndexOf(".");

  return dot > 0
    ? { base: name.slice(0, dot), extension: name.slice(dot) }
    : { base: name, extension: "" };
};

/**
 * Свободное имя для копии: «имя (копия).ext», затем «имя (копия 2).ext».
 * Цикл конечен: занятых имён конечное число, каждое следующее — новое.
 */
const copyNameOf = (name: string, folderId: string | null): string => {
  const { base, extension } = splitFileName(name);

  for (let index = 1; ; index += 1) {
    const suffix = index === 1 ? " (копия)" : ` (копия ${index})`;
    const candidate = `${base}${suffix}${extension}`;

    if (!isNameTaken(folderId, candidate, "")) {
      return candidate;
    }
  }
};

export type CopyMockFileResult =
  | { ok: true; file: FileItem }
  | { ok: false; reason: "not-found" | "target-not-found" | "quota-exceeded" };

/**
 * Копия — новый файл с тем же содержимым (`checksum`), но своими `id`
 * и датами. Квота проверяется как у загрузки: копия занимает тот же объём.
 */
export const copyMockFile = (
  fileId: string,
  targetFolderId?: string | null,
): CopyMockFileResult => {
  const file = findFile(fileId);

  if (!file) {
    return { ok: false, reason: "not-found" };
  }

  const folderId = targetFolderId === undefined ? file.folderId : targetFolderId;

  if (folderId && !findFolder(folderId)) {
    return { ok: false, reason: "target-not-found" };
  }

  if (usedBytes() + file.size > getDb().user.storageQuota) {
    return { ok: false, reason: "quota-exceeded" };
  }

  const now = new Date().toISOString();
  const copy: FileItem = {
    ...file,
    id: crypto.randomUUID(),
    name: copyNameOf(file.name, folderId),
    folderId,
    createdAt: now,
    updatedAt: now,
  };

  getDb().files.push(copy);
  refreshDb();

  return { ok: true, file: findFile(copy.id) ?? copy };
};

/** Бинарь в `localStorage` не пишем: тело собирается на лету. */
export const mockFileContent = (file: FileItem): MockFileContent => ({
  content: `Мок-содержимое файла «${file.name}» (${file.size} байт).`,
  mimeType: file.mimeType || mimeOf(file.name),
});
