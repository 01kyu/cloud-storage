import { describe, expect, it } from "vitest";

import { NodeType, type Folder } from "@cs/shared";

import { buildFolderTree } from "./build-tree";

const makeFolder = (id: string, name: string, parentId: string | null = null): Folder => ({
  id,
  type: NodeType.Folder,
  name,
  parentId,
  path: `/${id}/`,
  depth: parentId ? 1 : 0,
  childCount: 0,
  size: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("buildFolderTree", () => {
  it("собирает вложенные папки независимо от порядка в ответе", () => {
    const tree = buildFolderTree([
      makeFolder("child", "Отчёты", "root"),
      makeFolder("root", "Документы"),
      makeFolder("file", "Файлы"),
    ]);

    expect(tree.map((node) => node.name)).toEqual(["Документы", "Файлы"]);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(["Отчёты"]);
    expect(tree[1]?.children).toEqual([]);
  });

  it("сортирует уровни по имени с учётом чисел", () => {
    const tree = buildFolderTree([
      makeFolder("f10", "Папка 10"),
      makeFolder("f2", "Папка 2"),
      makeFolder("fa", "архив"),
    ]);

    expect(tree.map((node) => node.name)).toEqual(["архив", "Папка 2", "Папка 10"]);
  });

  it("поднимает папку с неизвестным родителем в корень", () => {
    const tree = buildFolderTree([makeFolder("orphan", "Сирота", "missing")]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("orphan");
  });

  it("возвращает пустой массив для пустого списка", () => {
    expect(buildFolderTree([])).toEqual([]);
  });
});
