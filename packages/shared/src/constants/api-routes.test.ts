import { describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "./api-routes";

const FOLDER_ID = "f0000000-0000-4000-8000-000000000001";
const FILE_ID = "a0000000-0000-4000-8000-000000000001";
const NODE_ID = "f0000000-0000-4000-8000-000000000007";
const SHARE_ID = "b0000000-0000-4000-8000-000000000001";
const TOKEN = "share-token-123456789012";

/**
 * Роуты — единственный источник адресов для моков и клиента: если строка
 * изменится, тест должен упасть, а не разъехаться с бэкендом молча.
 */
describe("API_BASE_PATH", () => {
  it("совпадает с префиксом моков и API-клиента", () => {
    expect(API_BASE_PATH).toBe("/api/v1");
  });
});

describe("API_ROUTES", () => {
  it("auth и search — статические адреса", () => {
    expect(API_ROUTES.auth).toEqual({
      register: "/auth/register",
      login: "/auth/login",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      me: "/auth/me",
    });
    expect(API_ROUTES.search.query).toBe("/search");
    expect(API_ROUTES.health).toBe("/health");
  });

  it("folders: статические адреса и подстановка id", () => {
    expect(API_ROUTES.folders.create).toBe("/folders");
    expect(API_ROUTES.folders.root).toBe("/folders");
    expect(API_ROUTES.folders.tree).toBe("/folders/tree");
    expect(API_ROUTES.folders.children(FOLDER_ID)).toBe(`/folders/${FOLDER_ID}/children`);
    expect(API_ROUTES.folders.byId(FOLDER_ID)).toBe(`/folders/${FOLDER_ID}`);
    expect(API_ROUTES.folders.breadcrumbs(FOLDER_ID)).toBe(`/folders/${FOLDER_ID}/breadcrumbs`);
    expect(API_ROUTES.folders.move(FOLDER_ID)).toBe(`/folders/${FOLDER_ID}/move`);
  });

  it("files: трёхшаговая загрузка и операции над файлом", () => {
    expect(API_ROUTES.files.uploadInit).toBe("/files/upload/init");
    expect(API_ROUTES.files.uploadComplete).toBe("/files/upload/complete");
    expect(API_ROUTES.files.mockUpload(FILE_ID)).toBe(`/mock-upload/${FILE_ID}`);
    expect(API_ROUTES.files.byId(FILE_ID)).toBe(`/files/${FILE_ID}`);
    expect(API_ROUTES.files.download(FILE_ID)).toBe(`/files/${FILE_ID}/download`);
    expect(API_ROUTES.files.move(FILE_ID)).toBe(`/files/${FILE_ID}/move`);
    expect(API_ROUTES.files.copy(FILE_ID)).toBe(`/files/${FILE_ID}/copy`);
  });

  it("trash: список, восстановление по узлу и массовая очистка", () => {
    expect(API_ROUTES.trash.list).toBe("/trash");
    expect(API_ROUTES.trash.purge).toBe("/trash/purge");
    expect(API_ROUTES.trash.restore(NODE_ID)).toBe(`/trash/${NODE_ID}/restore`);
    expect(API_ROUTES.trash.byId(NODE_ID)).toBe(`/trash/${NODE_ID}`);
  });

  it("shares: пользовательские и публичные адреса не пересекаются", () => {
    expect(API_ROUTES.shares.list).toBe("/shares");
    expect(API_ROUTES.shares.create).toBe("/shares");
    expect(API_ROUTES.shares.byId(SHARE_ID)).toBe(`/shares/${SHARE_ID}`);
    expect(API_ROUTES.shares.public(TOKEN)).toBe(`/public/shares/${TOKEN}`);
    expect(API_ROUTES.shares.publicDownload(TOKEN)).toBe(`/public/shares/${TOKEN}/download`);
  });

  it("все адреса начинаются со слэша и не содержат двойных слэшей", () => {
    const values = [
      ...Object.values(API_ROUTES.auth),
      ...Object.values(API_ROUTES.folders).map((value) =>
        typeof value === "function" ? value(FOLDER_ID) : value,
      ),
      ...Object.values(API_ROUTES.files).map((value) =>
        typeof value === "function" ? value(FILE_ID) : value,
      ),
      ...Object.values(API_ROUTES.trash).map((value) =>
        typeof value === "function" ? value(NODE_ID) : value,
      ),
      ...Object.values(API_ROUTES.shares).map((value) =>
        typeof value === "function" ? value(TOKEN) : value,
      ),
      API_ROUTES.search.query,
      API_ROUTES.health,
    ];

    values.forEach((path) => {
      expect(path.startsWith("/")).toBe(true);
      expect(path.includes("//")).toBe(false);
      expect(path.endsWith("/")).toBe(false);
    });
  });
});
