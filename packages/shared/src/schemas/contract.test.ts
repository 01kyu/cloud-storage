import { describe, expect, it } from "vitest";

import { NodeType } from "../enums/node-type";

import {
  apiErrorSchema,
  authResponseSchema,
  createListResponseSchema,
  fileSchema,
  folderSchema,
  loginPayloadSchema,
  nodeSchema,
  publicShareSchema,
  searchQuerySchema,
  searchResponseSchema,
  shareSchema,
  trashItemSchema,
  uploadInitResponseSchema,
  userSchema,
} from "./index";

const ISO_DATE = "2026-01-15T10:00:00.000Z";
const USER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const FOLDER_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3302";
const FILE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3303";
const SHARE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3304";

const validUser = {
  id: USER_ID,
  email: "demo@cloud.dev",
  name: "Demo User",
  avatarUrl: null,
  role: "user",
  storageQuota: 5 * 1024 ** 3,
  storageUsed: 1024,
  createdAt: ISO_DATE,
};

const validFolder = {
  id: FOLDER_ID,
  type: NodeType.Folder,
  name: "Documents",
  parentId: null,
  path: `/${FOLDER_ID}/`,
  depth: 0,
  childCount: 0,
  size: 0,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
};

const validFile = {
  id: FILE_ID,
  type: NodeType.File,
  name: "report.pdf",
  folderId: FOLDER_ID,
  mimeType: "application/pdf",
  extension: "pdf",
  kind: "document",
  size: 1024,
  status: "ready",
  checksum: "a".repeat(64),
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
};

describe("контракт @cs/shared", () => {
  it("валидирует пользователя", () => {
    expect(userSchema.parse(validUser)).toEqual(validUser);
    expect(() => userSchema.parse({ ...validUser, email: "not-an-email" })).toThrow();
  });

  it("валидирует папку и файл как discriminated union", () => {
    expect(folderSchema.parse(validFolder).type).toBe(NodeType.Folder);
    expect(fileSchema.parse(validFile).type).toBe(NodeType.File);
    expect(nodeSchema.parse(validFolder)).toMatchObject({ type: NodeType.Folder });
    expect(nodeSchema.parse(validFile)).toMatchObject({ type: NodeType.File });
  });

  it("отклоняет файл с неверной контрольной суммой и статусом", () => {
    expect(() => fileSchema.parse({ ...validFile, checksum: "too-short" })).toThrow();
    expect(() => fileSchema.parse({ ...validFile, status: "unknown" })).toThrow();
  });

  it("требует deletedAt у элемента корзины", () => {
    expect(trashItemSchema.parse({ ...validFile, deletedAt: ISO_DATE })).toMatchObject({
      type: NodeType.File,
    });
    expect(() => trashItemSchema.parse(validFile)).toThrow();
  });

  it("валидирует публичную и приватную ссылку", () => {
    const share = {
      id: SHARE_ID,
      nodeId: FILE_ID,
      nodeType: NodeType.File,
      nodeName: "report.pdf",
      token: "share-token-123",
      permission: "read",
      hasPassword: false,
      expiresAt: null,
      createdAt: ISO_DATE,
    };

    expect(shareSchema.parse(share)).toEqual(share);
    expect(
      publicShareSchema.parse({
        token: share.token,
        nodeType: NodeType.File,
        nodeName: share.nodeName,
        mimeType: "application/pdf",
        size: 1024,
        hasPassword: false,
        expiresAt: null,
      }),
    ).toMatchObject({ token: share.token });
  });

  it("валидирует ответ авторизации и payload логина", () => {
    expect(authResponseSchema.parse({ user: validUser, accessToken: "jwt" })).toMatchObject({
      user: { id: USER_ID },
    });
    expect(() =>
      loginPayloadSchema.parse({ email: "demo@cloud.dev", password: "short" }),
    ).toThrow();
  });

  it("валидирует ошибку API", () => {
    expect(
      apiErrorSchema.parse({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Файл не найден",
        details: { fileId: FILE_ID },
      }),
    ).toMatchObject({ code: "NOT_FOUND" });
    expect(() =>
      apiErrorSchema.parse({ statusCode: 200, code: "NOT_FOUND", message: "x" }),
    ).toThrow();
  });

  it("валидирует ответ upload/init и список узлов", () => {
    const uploadInit = {
      file: validFile,
      uploadUrl: `/mock-upload/${FILE_ID}`,
      expiresAt: ISO_DATE,
    };

    expect(uploadInitResponseSchema.parse(uploadInit)).toMatchObject({ file: { id: FILE_ID } });

    const listSchema = createListResponseSchema(nodeSchema);
    expect(
      listSchema.parse({ items: [validFolder, validFile], nextCursor: null }).items,
    ).toHaveLength(2);
  });

  it("валидирует запрос поиска: минимум символов, тип и вид файла", () => {
    expect(searchQuerySchema.parse({ q: "  отчёт  " })).toMatchObject({ q: "отчёт" });
    expect(
      searchQuerySchema.parse({ q: "отчёт", type: NodeType.Folder, limit: "10" }),
    ).toMatchObject({ type: NodeType.Folder, limit: 10 });
    expect(searchQuerySchema.parse({ q: "отчёт", kind: "image" })).toMatchObject({
      kind: "image",
    });

    expect(() => searchQuerySchema.parse({ q: "я" })).toThrow();
    expect(() => searchQuerySchema.parse({ q: "отчёт", type: "unknown" })).toThrow();
    expect(() => searchQuerySchema.parse({ q: "отчёт", kind: "unknown" })).toThrow();
  });

  it("валидирует ответ поиска как список узлов", () => {
    const page = searchResponseSchema.parse({ items: [validFolder, validFile], nextCursor: "1" });

    expect(page.items.map((item) => item.type)).toEqual([NodeType.Folder, NodeType.File]);
    expect(page.nextCursor).toBe("1");
  });
});
