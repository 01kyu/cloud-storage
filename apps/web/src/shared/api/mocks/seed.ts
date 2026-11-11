import {
  DEMO_USER,
  FileKind,
  FileStatus,
  LIMITS,
  NodeType,
  UserRole,
  type FileItem,
  type Folder,
  type Share,
  type TrashItem,
} from "@cs/shared";
import { checksumOf } from "@shared/lib";

import { MOCK_DB_VERSION } from "./constants";
import type { MockDb, MockUser } from "./db";
import { extensionOf } from "./file-meta";
import { recountFolders, storageUsed } from "./recount";

/** Детерминированные uuid: версия 4 и вариант 8 — проходят `z.uuid()`. */
const folderId = (value: number): string =>
  `f0000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const fileId = (value: number): string =>
  `a0000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

/** Стабильные id сидов: на них опираются тесты и dev-ссылки. */
export const SEED_IDS = {
  documents: folderId(1),
  reports: folderId(2),
  contracts: folderId(3),
  photos: folderId(4),
  photos2026: folderId(5),
  music: folderId(6),
  emptyFolder: folderId(7),
  estimate: fileId(1),
  summary: fileId(2),
  contract: fileId(3),
  resume: fileId(4),
  notes: fileId(5),
  archive: fileId(6),
  beach: fileId(7),
  mountains: fileId(8),
  podcast: fileId(9),
  presentation: fileId(10),
  screenshot: fileId(11),
  uploading: fileId(12),
} as const;

type FolderSeed = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Порядок важен: родитель объявляется раньше ребёнка — путь считается от родителя. */
const FOLDER_SEEDS: FolderSeed[] = [
  {
    id: SEED_IDS.documents,
    name: "Документы",
    parentId: null,
    createdAt: "2026-01-08T09:15:00.000Z",
    updatedAt: "2026-02-11T12:40:00.000Z",
  },
  {
    id: SEED_IDS.reports,
    name: "Отчёты",
    parentId: SEED_IDS.documents,
    createdAt: "2026-01-12T10:05:00.000Z",
    updatedAt: "2026-02-11T12:40:00.000Z",
  },
  {
    id: SEED_IDS.contracts,
    name: "Договоры",
    parentId: SEED_IDS.documents,
    createdAt: "2026-01-19T15:20:00.000Z",
    updatedAt: "2026-02-02T08:30:00.000Z",
  },
  {
    id: SEED_IDS.photos,
    name: "Фотографии",
    parentId: null,
    createdAt: "2026-01-21T18:45:00.000Z",
    updatedAt: "2026-02-14T19:10:00.000Z",
  },
  {
    id: SEED_IDS.photos2026,
    name: "2026",
    parentId: SEED_IDS.photos,
    createdAt: "2026-02-14T19:10:00.000Z",
    updatedAt: "2026-02-14T19:10:00.000Z",
  },
  {
    id: SEED_IDS.music,
    name: "Музыка",
    parentId: null,
    createdAt: "2026-01-25T21:00:00.000Z",
    updatedAt: "2026-01-25T21:00:00.000Z",
  },
  {
    id: SEED_IDS.emptyFolder,
    name: "Пустая папка",
    parentId: null,
    createdAt: "2026-02-20T07:00:00.000Z",
    updatedAt: "2026-02-20T07:00:00.000Z",
  },
];

type FileSeed = {
  id: string;
  name: string;
  folderId: string | null;
  mimeType: string;
  size: number;
  kind: FileKind;
  createdAt: string;
  updatedAt: string;
  status?: FileStatus;
};

const FILE_SEEDS: FileSeed[] = [
  {
    id: SEED_IDS.estimate,
    name: "Смета.xlsx",
    folderId: SEED_IDS.reports,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 245_760,
    kind: FileKind.Document,
    createdAt: "2026-01-14T08:10:00.000Z",
    updatedAt: "2026-02-10T09:00:00.000Z",
  },
  {
    id: SEED_IDS.summary,
    name: "Итоги года.pdf",
    folderId: SEED_IDS.reports,
    mimeType: "application/pdf",
    size: 1_887_436,
    kind: FileKind.Document,
    createdAt: "2026-01-14T08:12:00.000Z",
    updatedAt: "2026-02-11T12:40:00.000Z",
  },
  {
    id: SEED_IDS.contract,
    name: "Договор №14.docx",
    folderId: SEED_IDS.contracts,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 98_304,
    kind: FileKind.Document,
    createdAt: "2026-01-22T11:30:00.000Z",
    updatedAt: "2026-02-02T08:30:00.000Z",
  },
  {
    id: SEED_IDS.resume,
    name: "Резюме.pdf",
    folderId: null,
    mimeType: "application/pdf",
    size: 524_288,
    kind: FileKind.Document,
    createdAt: "2026-01-09T07:45:00.000Z",
    updatedAt: "2026-01-30T16:20:00.000Z",
  },
  {
    id: SEED_IDS.notes,
    name: "Заметки.txt",
    folderId: null,
    mimeType: "text/plain",
    size: 2_048,
    kind: FileKind.Document,
    createdAt: "2026-02-03T13:05:00.000Z",
    updatedAt: "2026-02-03T13:05:00.000Z",
  },
  {
    id: SEED_IDS.archive,
    name: "Бэкап-2025.zip",
    folderId: null,
    mimeType: "application/zip",
    size: 41_943_040,
    kind: FileKind.Archive,
    createdAt: "2026-01-02T20:00:00.000Z",
    updatedAt: "2026-01-02T20:00:00.000Z",
  },
  {
    id: SEED_IDS.beach,
    name: "Пляж.jpg",
    folderId: SEED_IDS.photos2026,
    mimeType: "image/jpeg",
    size: 3_145_728,
    kind: FileKind.Image,
    createdAt: "2026-02-14T19:10:00.000Z",
    updatedAt: "2026-02-14T19:10:00.000Z",
  },
  {
    id: SEED_IDS.mountains,
    name: "Горы.png",
    folderId: SEED_IDS.photos,
    mimeType: "image/png",
    size: 5_242_880,
    kind: FileKind.Image,
    createdAt: "2026-01-23T10:15:00.000Z",
    updatedAt: "2026-01-23T10:15:00.000Z",
  },
  {
    id: SEED_IDS.podcast,
    name: "Подкаст.mp3",
    folderId: SEED_IDS.music,
    mimeType: "audio/mpeg",
    size: 12_582_912,
    kind: FileKind.Audio,
    createdAt: "2026-01-25T21:00:00.000Z",
    updatedAt: "2026-01-25T21:00:00.000Z",
  },
  {
    id: SEED_IDS.presentation,
    name: "Питч.pptx",
    folderId: SEED_IDS.documents,
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: 7_340_032,
    kind: FileKind.Document,
    createdAt: "2026-02-05T09:40:00.000Z",
    updatedAt: "2026-02-06T14:25:00.000Z",
  },
  {
    id: SEED_IDS.screenshot,
    name: "Скриншот.png",
    folderId: null,
    mimeType: "image/png",
    size: 1_048_576,
    kind: FileKind.Image,
    createdAt: "2026-02-18T11:11:00.000Z",
    updatedAt: "2026-02-18T11:11:00.000Z",
  },
  {
    id: SEED_IDS.uploading,
    name: "Отпуск.mp4",
    folderId: SEED_IDS.photos2026,
    mimeType: "video/mp4",
    size: 87_380_736,
    kind: FileKind.Video,
    createdAt: "2026-02-22T17:30:00.000Z",
    updatedAt: "2026-02-22T17:30:00.000Z",
    status: FileStatus.Uploading,
  },
];

const buildFolders = (seeds: FolderSeed[]): Folder[] => {
  const built: Folder[] = [];

  seeds.forEach((seed) => {
    const parent = seed.parentId ? built.find((folder) => folder.id === seed.parentId) : undefined;
    const parentPath = parent ? parent.path : "/";

    built.push({
      id: seed.id,
      type: NodeType.Folder,
      name: seed.name,
      parentId: seed.parentId,
      path: `${parentPath}${seed.id}/`,
      depth: parent ? parent.depth + 1 : 0,
      childCount: 0,
      size: 0,
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
    });
  });

  return built;
};

const buildFiles = (seeds: FileSeed[]): FileItem[] =>
  seeds.map((seed) => ({
    id: seed.id,
    type: NodeType.File,
    name: seed.name,
    folderId: seed.folderId,
    mimeType: seed.mimeType,
    extension: extensionOf(seed.name),
    kind: seed.kind,
    size: seed.size,
    status: seed.status ?? FileStatus.Ready,
    checksum: seed.status === FileStatus.Uploading ? null : checksumOf(seed.name),
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
  }));

const seedUser: MockUser = {
  id: "c0000000-0000-4000-8000-000000000001",
  email: DEMO_USER.email,
  name: "Демо Пользователь",
  avatarUrl: null,
  role: UserRole.User,
  storageQuota: LIMITS.defaultStorageQuotaBytes,
  storageUsed: 0,
  createdAt: "2026-01-05T08:00:00.000Z",
  password: DEMO_USER.password,
};

export const createSeedDb = (): MockDb => {
  const files = buildFiles(FILE_SEEDS);
  const folders = recountFolders(buildFolders(FOLDER_SEEDS), files);
  const shares: Share[] = [];
  const trash: TrashItem[] = [];

  return {
    version: MOCK_DB_VERSION,
    user: {
      ...seedUser,
      storageUsed: storageUsed(files),
    },
    folders,
    files,
    trash,
    shares,
    session: null,
  };
};
