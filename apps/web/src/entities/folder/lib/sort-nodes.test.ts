import { describe, expect, it } from "vitest";

import {
  FileKind,
  FileStatus,
  NodeType,
  SortDirection,
  SortField,
  type FileItem,
  type Folder,
  type Node,
} from "@cs/shared";

import { sortNodes } from "./sort-nodes";

const makeFolder = (id: string, name: string, size = 0): Folder => ({
  id,
  type: NodeType.Folder,
  name,
  parentId: null,
  path: `/${id}/`,
  depth: 0,
  childCount: 0,
  size,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
});

const makeFile = (
  id: string,
  name: string,
  size: number,
  updatedAt = "2026-01-01T00:00:00.000Z",
): FileItem => ({
  id,
  type: NodeType.File,
  name,
  folderId: null,
  mimeType: "text/plain",
  extension: "txt",
  kind: FileKind.Document,
  size,
  status: FileStatus.Ready,
  checksum: "0".repeat(64),
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt,
});

const names = (nodes: Node[]): string[] => nodes.map((node) => node.name);

describe("sortNodes", () => {
  it("всегда ставит папки выше файлов", () => {
    const sorted = sortNodes(
      [makeFile("a", "aaa", 10), makeFolder("z", "яяя"), makeFile("b", "bbb", 20)],
      SortField.Size,
      SortDirection.Desc,
    );

    expect(names(sorted)).toEqual(["яяя", "bbb", "aaa"]);
  });

  it("сортирует по имени без учёта регистра и с числами", () => {
    const sorted = sortNodes([
      makeFile("a", "Отчёт 10", 1),
      makeFile("b", "отчёт 2", 1),
      makeFile("c", "Альбом", 1),
    ]);

    expect(names(sorted)).toEqual(["Альбом", "отчёт 2", "Отчёт 10"]);
  });

  it("сортирует по размеру и дате в обратном порядке", () => {
    const bySize = sortNodes(
      [makeFile("a", "a", 100), makeFile("b", "b", 5)],
      SortField.Size,
      SortDirection.Desc,
    );
    const byDate = sortNodes(
      [
        makeFile("a", "a", 1, "2026-01-01T00:00:00.000Z"),
        makeFile("b", "b", 1, "2026-03-01T00:00:00.000Z"),
      ],
      SortField.UpdatedAt,
      SortDirection.Desc,
    );

    expect(names(bySize)).toEqual(["a", "b"]);
    expect(names(byDate)).toEqual(["b", "a"]);
  });

  it("не мутирует исходный массив", () => {
    const source = [makeFile("a", "b", 1), makeFile("b", "a", 1)];

    sortNodes(source);

    expect(names(source)).toEqual(["b", "a"]);
  });
});
