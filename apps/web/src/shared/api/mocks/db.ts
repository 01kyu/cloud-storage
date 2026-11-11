import {
  NodeType,
  type Breadcrumb,
  type FileItem,
  type Folder,
  type Node,
  type Share,
  type TrashItem,
  type User,
} from "@cs/shared";

import { MOCK_DB_STORAGE_KEY, MOCK_DB_VERSION } from "./constants";
import { recountFolders, storageUsed } from "./recount";
import { createSeedDb } from "./seed";

/** Пользователь мока: к контрактному `User` добавлен пароль для логина. */
export type MockUser = User & { password: string };

export type MockSession = { token: string };

export type MockDb = {
  version: number;
  user: MockUser;
  folders: Folder[];
  files: FileItem[];
  /** Корзина: узлы с `deletedAt`. */
  trash: TrashItem[];
  shares: Share[];
  session: MockSession | null;
};

let db: MockDb | null = null;

const isMockDb = (value: unknown): value is MockDb => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<MockDb>;

  return (
    candidate.version === MOCK_DB_VERSION &&
    Array.isArray(candidate.folders) &&
    Array.isArray(candidate.files) &&
    Array.isArray(candidate.trash) &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  );
};

/** Метаданные ФС переживают перезагрузку страницы; бинарные данные не храним. */
const loadDb = (): MockDb => {
  try {
    const raw = globalThis.localStorage?.getItem(MOCK_DB_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;

    if (isMockDb(parsed)) {
      return parsed;
    }
  } catch {
    // Повреждённый JSON или запрет storage — просто начинаем с сидов.
  }

  return createSeedDb();
};

export const getDb = (): MockDb => {
  db ??= loadDb();

  return db;
};

export const saveDb = (): void => {
  try {
    globalThis.localStorage?.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(getDb()));
  } catch {
    // Приватный режим: изменения живут только в памяти вкладки.
  }
};

export const resetDb = (): MockDb => {
  db = createSeedDb();
  saveDb();

  return db;
};

/** Пересчитывает производные поля: мутации меняют только «первичные» поля узлов. */
export const refreshDb = (): MockDb => {
  const current = getDb();

  current.folders = recountFolders(current.folders, current.files);
  current.user.storageUsed = storageUsed(current.files, current.trash);
  saveDb();

  return current;
};

export const findFolder = (folderId: string): Folder | undefined =>
  getDb().folders.find((folder) => folder.id === folderId);

export const findFile = (fileId: string): FileItem | undefined =>
  getDb().files.find((file) => file.id === fileId);

export const findNode = (nodeId: string): Node | undefined =>
  findFolder(nodeId) ?? findFile(nodeId);

/** Дети папки (`null` — корень): папки и файлы вместе. */
export const childNodes = (folderId: string | null): Node[] => {
  const current = getDb();

  return [
    ...current.folders.filter((folder) => folder.parentId === folderId),
    ...current.files.filter((file) => file.folderId === folderId),
  ];
};

export const folderTree = (): Folder[] =>
  [...getDb().folders].sort((a, b) => a.path.localeCompare(b.path));

export const folderBreadcrumbs = (folderId: string): Breadcrumb[] => {
  const folders = new Map(getDb().folders.map((folder) => [folder.id, folder]));
  const breadcrumbs: Breadcrumb[] = [];

  let currentId: string | null = folderId;

  while (currentId) {
    const folder = folders.get(currentId);

    if (!folder) {
      break;
    }

    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return breadcrumbs;
};

export type CreateMockFolderResult =
  { ok: true; folder: Folder } | { ok: false; reason: "parent-not-found" | "duplicate" };

/**
 * Путь и глубина считаются от родителя; имя уникально в пределах родителя без учёта
 * регистра — как партиальный unique-индекс `(owner_id, parent_id, lower(name))`.
 */
export const createMockFolder = (name: string, parentId: string | null): CreateMockFolderResult => {
  const current = getDb();
  const parent = parentId ? findFolder(parentId) : undefined;

  if (parentId && !parent) {
    return { ok: false, reason: "parent-not-found" };
  }

  const normalized = name.trim().toLowerCase();
  const isDuplicate = current.folders.some(
    (folder) => folder.parentId === parentId && folder.name.trim().toLowerCase() === normalized,
  );

  if (isDuplicate) {
    return { ok: false, reason: "duplicate" };
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const folder: Folder = {
    id,
    type: NodeType.Folder,
    name: name.trim(),
    parentId,
    path: `${parent ? parent.path : "/"}${id}/`,
    depth: parent ? parent.depth + 1 : 0,
    childCount: 0,
    size: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (parent) {
    parent.childCount += 1;
    parent.updatedAt = now;
  }

  current.folders.push(folder);
  refreshDb();

  return { ok: true, folder };
};

export const usedBytes = (): number => storageUsed(getDb().files, getDb().trash);

export const publicUser = (user: MockUser): User => {
  const { password: _password, ...rest } = user;

  return rest;
};
