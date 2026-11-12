import { describe, expect, it } from "vitest";

import { FileKind, FileStatus, NodeType, type TrashItem } from "@cs/shared";

import { describeTrashItem } from "./describe-trash-item";

const trashedFolder: TrashItem = {
  id: "f0000000-0000-4000-8000-000000000001",
  type: NodeType.Folder,
  name: "Документы",
  parentId: null,
  path: "/f0000000-0000-4000-8000-000000000001/",
  depth: 0,
  childCount: 3,
  size: 1024,
  createdAt: "2026-01-08T09:15:00.000Z",
  updatedAt: "2026-02-11T12:40:00.000Z",
  deletedAt: "2026-02-12T10:00:00.000Z",
};

const trashedFile: TrashItem = {
  id: "a0000000-0000-4000-8000-000000000004",
  type: NodeType.File,
  name: "Резюме.pdf",
  folderId: null,
  mimeType: "application/pdf",
  extension: "pdf",
  kind: FileKind.Document,
  size: 2048,
  status: FileStatus.Ready,
  checksum: "a".repeat(64),
  createdAt: "2026-01-14T08:10:00.000Z",
  updatedAt: "2026-01-14T08:10:00.000Z",
  deletedAt: "2026-02-12T10:00:00.000Z",
};

describe("describeTrashItem", () => {
  it("у папки показывает число объектов и размер поддерева", () => {
    expect(describeTrashItem(trashedFolder)).toBe("Папка · объектов: 3 · 1.0 KB");
  });

  it("у файла показывает размер", () => {
    expect(describeTrashItem(trashedFile)).toBe("Файл · 2.0 KB");
  });
});
