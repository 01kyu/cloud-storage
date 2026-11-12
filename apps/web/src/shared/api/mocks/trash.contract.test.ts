import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  apiErrorSchema,
  createListResponseSchema,
  DEMO_USER,
  fileSchema,
  folderSchema,
  trashItemSchema,
} from "@cs/shared";

import { getDb } from "./db";
import { SEED_IDS } from "./seed";

const trashListSchema = createListResponseSchema(trashItemSchema);

const origin = window.location.origin;

type JsonResult = { status: number; body: unknown };

const request = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${origin}${API_BASE_PATH}${path}`, init);

const readBody = async (response: Response): Promise<unknown> =>
  response.status === 204 ? null : await response.json();

const getJson = async (path: string): Promise<JsonResult> => {
  const response = await request(path);

  return { status: response.status, body: await readBody(response) };
};

const sendJson = async (method: string, path: string, body?: unknown): Promise<JsonResult> => {
  const response = await request(path, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });

  return { status: response.status, body: await readBody(response) };
};

const deleteJson = (path: string): Promise<JsonResult> => sendJson("DELETE", path);

const moveFileToTrash = (fileId: string): Promise<JsonResult> =>
  deleteJson(API_ROUTES.files.byId(fileId));

const moveFolderToTrash = (folderId: string): Promise<JsonResult> =>
  deleteJson(API_ROUTES.folders.byId(folderId));

const restoreNode = (nodeId: string): Promise<JsonResult> =>
  sendJson("POST", API_ROUTES.trash.restore(nodeId));

const purgeNode = (nodeId: string): Promise<JsonResult> =>
  deleteJson(API_ROUTES.trash.byId(nodeId));

const purgeTrash = (ids: string[]): Promise<JsonResult> =>
  sendJson("POST", API_ROUTES.trash.purge, { ids });

beforeEach(async () => {
  await sendJson("POST", API_ROUTES.auth.login, DEMO_USER);
});

describe("GET /trash", () => {
  it("отдаёт корни удалений по контракту, свежие сверху", async () => {
    await moveFileToTrash(SEED_IDS.resume);
    await moveFolderToTrash(SEED_IDS.documents);

    const { status, body } = await getJson(API_ROUTES.trash.list);
    const page = trashListSchema.parse(body);
    const ids = page.items.map((item) => item.id);

    expect(status).toBe(200);
    expect(page.items.every((item) => trashItemSchema.parse(item))).toBe(true);
    expect(ids).toContain(SEED_IDS.resume);
    expect(ids).toContain(SEED_IDS.documents);
    // Содержимое удалённой папки отдельными строками не показываем.
    expect(ids).not.toContain(SEED_IDS.estimate);
    expect(page.nextCursor).toBeNull();
    expect(getDb().trash.length).toBeGreaterThan(page.items.length);
  });

  it("поддерживает курсорную пагинацию", async () => {
    await moveFileToTrash(SEED_IDS.resume);
    await moveFolderToTrash(SEED_IDS.documents);

    const first = await getJson(`${API_ROUTES.trash.list}?limit=1`);
    const firstPage = trashListSchema.parse(first.body);

    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.nextCursor).not.toBeNull();

    const second = await getJson(`${API_ROUTES.trash.list}?limit=1&cursor=${firstPage.nextCursor}`);

    expect(trashListSchema.parse(second.body).items).toHaveLength(1);
  });

  it("без сессии отвечает 401", async () => {
    await sendJson("POST", API_ROUTES.auth.logout);

    const { status, body } = await getJson(API_ROUTES.trash.list);

    expect(status).toBe(401);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("POST /trash/:id/restore", () => {
  it("возвращает файл на место и сохраняет занятую квоту", async () => {
    const usedBefore = getDb().user.storageUsed;

    await moveFileToTrash(SEED_IDS.resume);

    const { status, body } = await restoreNode(SEED_IDS.resume);
    const restored = fileSchema.parse(body);

    expect(status).toBe(200);
    expect(restored).toMatchObject({ id: SEED_IDS.resume, folderId: null });
    expect(restored).not.toHaveProperty("deletedAt");
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(true);
    expect(getDb().trash.some((item) => item.id === SEED_IDS.resume)).toBe(false);
    expect(getDb().user.storageUsed).toBe(usedBefore);
  });

  it("возвращает папку с поддеревом и пересчитывает пути", async () => {
    await moveFolderToTrash(SEED_IDS.reports);

    const { status, body } = await restoreNode(SEED_IDS.reports);
    const restored = folderSchema.parse(body);
    const db = getDb();
    const parent = db.folders.find((folder) => folder.id === SEED_IDS.documents);
    const estimate = db.files.find((file) => file.id === SEED_IDS.estimate);

    expect(status).toBe(200);
    expect(restored.parentId).toBe(SEED_IDS.documents);
    expect(restored.path).toBe(`${parent?.path}${SEED_IDS.reports}/`);
    expect(restored.depth).toBe((parent?.depth ?? 0) + 1);
    expect(estimate?.folderId).toBe(SEED_IDS.reports);
    expect(db.trash).toHaveLength(0);
  });

  it("восстанавливает в корень, если исходной папки больше нет", async () => {
    await moveFileToTrash(SEED_IDS.estimate);
    await moveFolderToTrash(SEED_IDS.reports);

    const { status, body } = await restoreNode(SEED_IDS.estimate);

    expect(status).toBe(200);
    expect(fileSchema.parse(body).folderId).toBeNull();
  });

  it("не восстанавливает на занятое имя и неизвестный id", async () => {
    await moveFileToTrash(SEED_IDS.resume);
    await sendJson("POST", API_ROUTES.files.uploadInit, {
      name: "Резюме.pdf",
      folderId: null,
      size: 10,
      mimeType: "application/pdf",
    });

    const duplicate = await restoreNode(SEED_IDS.resume);
    const unknown = await restoreNode("ffffffff-0000-4000-8000-000000000000");

    expect(duplicate.status).toBe(409);
    expect(apiErrorSchema.parse(duplicate.body)).toMatchObject({ code: "CONFLICT" });
    expect(unknown.status).toBe(404);
    expect(apiErrorSchema.parse(unknown.body)).toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("DELETE /trash/:id", () => {
  it("удаляет файл навсегда и освобождает квоту", async () => {
    const usedBefore = getDb().user.storageUsed;

    await moveFileToTrash(SEED_IDS.resume);

    const size = getDb().trash.find((item) => item.id === SEED_IDS.resume)?.size ?? 0;
    const { status } = await purgeNode(SEED_IDS.resume);

    expect(status).toBe(204);
    expect(getDb().trash.some((item) => item.id === SEED_IDS.resume)).toBe(false);
    expect(getDb().user.storageUsed).toBe(usedBefore - size);
    expect((await purgeNode(SEED_IDS.resume)).status).toBe(404);
  });

  it("удаляет папку вместе со всем поддеревом", async () => {
    await moveFolderToTrash(SEED_IDS.documents);

    expect(getDb().trash.length).toBeGreaterThan(1);

    const { status } = await purgeNode(SEED_IDS.documents);

    expect(status).toBe(204);
    expect(getDb().trash).toHaveLength(0);
  });
});

describe("POST /trash/purge", () => {
  it("удаляет пачку элементов и считает квоту заново", async () => {
    await moveFileToTrash(SEED_IDS.resume);
    await moveFileToTrash(SEED_IDS.screenshot);

    const { status } = await purgeTrash([SEED_IDS.resume, SEED_IDS.screenshot]);

    expect(status).toBe(204);
    expect(getDb().trash).toHaveLength(0);
    expect(getDb().user.storageUsed).toBe(
      getDb().files.reduce((total, file) => total + file.size, 0),
    );
  });

  it("игнорирует неизвестные id и отклоняет пустой список", async () => {
    await moveFileToTrash(SEED_IDS.resume);

    const mixed = await purgeTrash([SEED_IDS.resume, "ffffffff-0000-4000-8000-000000000000"]);
    const empty = await purgeTrash([]);

    expect(mixed.status).toBe(204);
    expect(empty.status).toBe(400);
    expect(apiErrorSchema.parse(empty.body)).toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("без сессии отвечает 401 и не трогает корзину", async () => {
    await moveFileToTrash(SEED_IDS.resume);
    await sendJson("POST", API_ROUTES.auth.logout);

    const { status, body } = await purgeTrash([SEED_IDS.resume]);

    expect(status).toBe(401);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "UNAUTHORIZED" });
    expect(getDb().trash).toHaveLength(1);
  });
});
