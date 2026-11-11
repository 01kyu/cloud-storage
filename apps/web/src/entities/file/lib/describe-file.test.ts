import { describe, expect, it } from "vitest";

import { FileKind, FileStatus, NodeType, type FileItem } from "@cs/shared";

import { describeFile, getFileExtension, getFileKindLabel } from "./describe-file";

const makeFile = (name: string, kind: FileKind): FileItem => ({
  id: "file-1",
  type: NodeType.File,
  name,
  folderId: null,
  mimeType: "application/octet-stream",
  extension: getFileExtension(name),
  kind,
  size: 1_024,
  status: FileStatus.Ready,
  checksum: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("getFileExtension", () => {
  it("возвращает расширение в нижнем регистре", () => {
    expect(getFileExtension("Отчёт.PDF")).toBe("pdf");
  });

  it("возвращает null для файлов без расширения и скрытых файлов", () => {
    expect(getFileExtension("README")).toBeNull();
    expect(getFileExtension(".gitignore")).toBeNull();
    expect(getFileExtension("файл.")).toBeNull();
  });
});

describe("getFileKindLabel", () => {
  it("переводит все типы файлов", () => {
    expect(Object.values(FileKind).map(getFileKindLabel)).toEqual([
      "Изображение",
      "Видео",
      "Аудио",
      "Документ",
      "Архив",
      "Файл",
    ]);
  });
});

describe("describeFile", () => {
  it("собирает подпись из расширения и типа", () => {
    expect(describeFile(makeFile("Отчёт.pdf", FileKind.Document))).toBe("PDF · Документ");
  });

  it("обходится без расширения", () => {
    expect(describeFile(makeFile("README", FileKind.Other))).toBe("Файл");
  });
});
