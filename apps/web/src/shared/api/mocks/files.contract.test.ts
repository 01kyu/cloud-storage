import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  apiErrorSchema,
  DEMO_USER,
  fileSchema,
  folderSchema,
  LIMITS,
  trashItemSchema,
  uploadInitResponseSchema,
} from "@cs/shared";

import { getDb } from "./db";
import { SEED_IDS } from "./seed";

const origin = window.location.origin;

type JsonResult = { status: number; body: unknown };

const request = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${origin}${API_BASE_PATH}${path}`, init);

const readBody = async (response: Response): Promise<unknown> =>
  response.status === 204 ? null : await response.json();

const sendJson = async (method: string, path: string, body: unknown): Promise<JsonResult> => {
  const response = await request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return { status: response.status, body: await readBody(response) };
};

const getJson = async (path: string): Promise<JsonResult> => {
  const response = await request(path);

  return { status: response.status, body: await readBody(response) };
};

const deleteJson = async (path: string): Promise<JsonResult> => {
  const response = await request(path, { method: "DELETE" });

  return { status: response.status, body: await readBody(response) };
};

const initUpload = (
  name: string,
  size = 1024,
  folderId: string | null = null,
): Promise<JsonResult> =>
  sendJson("POST", API_ROUTES.files.uploadInit, {
    name,
    size,
    folderId,
    mimeType: "text/plain",
  });

const completeUpload = (fileId: string, checksum = "a".repeat(64)): Promise<JsonResult> =>
  sendJson("POST", API_ROUTES.files.uploadComplete, { fileId, checksum });

beforeEach(async () => {
  await sendJson("POST", API_ROUTES.auth.login, DEMO_USER);
});

describe("POST /files/upload/init", () => {
  it("создаёт файл в статусе uploading и отдаёт ссылку на загрузку", async () => {
    const { status, body } = await initUpload("Новый файл.txt", 2048);
    const payload = uploadInitResponseSchema.parse(body);

    expect(status).toBe(201);
    expect(payload.file.status).toBe("uploading");
    expect(payload.file.checksum).toBeNull();
    expect(payload.uploadUrl).toBe(
      `${API_BASE_PATH}${API_ROUTES.files.mockUpload(payload.file.id)}`,
    );
    expect(new Date(payload.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(getDb().files.find((file) => file.id === payload.file.id)).toMatchObject({
      name: "Новый файл.txt",
      size: 2048,
      extension: "txt",
      kind: "document",
    });
  });

  it("отклоняет дубликат имени, слишком большой файл и тело без полей", async () => {
    const duplicate = await initUpload("Резюме.pdf");
    const tooLarge = await initUpload("Огромный.bin", LIMITS.maxFileSizeBytes + 1);
    const invalid = await sendJson("POST", API_ROUTES.files.uploadInit, { name: "x" });

    expect(duplicate.status).toBe(409);
    expect(apiErrorSchema.parse(duplicate.body)).toMatchObject({ code: "CONFLICT" });
    expect(tooLarge.status).toBe(413);
    expect(apiErrorSchema.parse(tooLarge.body)).toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(invalid.status).toBe(400);
    expect(apiErrorSchema.parse(invalid.body)).toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("учитывает квоту и неизвестную папку", async () => {
    getDb().user.storageQuota = 100;

    const overQuota = await initUpload("Большой.txt", 200);
    const noFolder = await initUpload("Файл.txt", 10, "ffffffff-0000-4000-8000-000000000000");

    expect(overQuota.status).toBe(413);
    expect(apiErrorSchema.parse(overQuota.body)).toMatchObject({ code: "QUOTA_EXCEEDED" });
    expect(noFolder.status).toBe(404);
    expect(apiErrorSchema.parse(noFolder.body)).toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("загрузка файла", () => {
  it("проходит init → PUT тела → complete и делает файл ready", async () => {
    const init = await initUpload("Черновик.txt");
    const { file, uploadUrl } = uploadInitResponseSchema.parse(init.body);

    const put = await fetch(`${origin}${uploadUrl}`, { method: "PUT", body: new Blob(["данные"]) });
    const done = await completeUpload(file.id);
    const ready = fileSchema.parse(done.body);

    expect(put.status).toBe(204);
    expect(done.status).toBe(200);
    expect(ready).toMatchObject({ id: file.id, status: "ready" });
    expect(ready.checksum).toHaveLength(64);
    expect((await completeUpload(file.id)).status).toBe(409);
  });

  it("не принимает тело для неизвестной загрузки и некорректный checksum", async () => {
    const unknown = await request(
      API_ROUTES.files.mockUpload("ffffffff-0000-4000-8000-000000000000"),
      {
        method: "PUT",
        body: new Blob(["данные"]),
      },
    );
    const invalid = await completeUpload(SEED_IDS.resume, "not-a-checksum");

    expect(unknown.status).toBe(404);
    expect(invalid.status).toBe(400);
  });
});

describe("GET /files/:id/download", () => {
  it("отдаёт файл вложением с корректным именем", async () => {
    const response = await request(API_ROUTES.files.download(SEED_IDS.summary));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    expect(await response.text()).toContain("Итоги года.pdf");
  });

  it("не отдаёт файл в статусе uploading и неизвестный файл", async () => {
    const uploading = await getJson(API_ROUTES.files.download(SEED_IDS.uploading));
    const unknown = await getJson(
      API_ROUTES.files.download("ffffffff-0000-4000-8000-000000000000"),
    );

    expect(uploading.status).toBe(404);
    expect(unknown.status).toBe(404);
  });
});

describe("PATCH /files/:id", () => {
  it("переименовывает файл и пересчитывает расширение", async () => {
    const { status, body } = await sendJson("PATCH", API_ROUTES.files.byId(SEED_IDS.summary), {
      name: "Итоги 2026.PDF",
    });

    expect(status).toBe(200);
    expect(fileSchema.parse(body)).toMatchObject({ name: "Итоги 2026.PDF", extension: "pdf" });
    expect(getDb().files.find((file) => file.id === SEED_IDS.summary)?.name).toBe("Итоги 2026.PDF");
  });

  it("отклоняет дубликат, пустое имя и неизвестный файл", async () => {
    const duplicate = await sendJson("PATCH", API_ROUTES.files.byId(SEED_IDS.estimate), {
      name: "Итоги года.pdf",
    });
    const blank = await sendJson("PATCH", API_ROUTES.files.byId(SEED_IDS.estimate), { name: "  " });
    const unknown = await sendJson(
      "PATCH",
      API_ROUTES.files.byId("ffffffff-0000-4000-8000-000000000000"),
      { name: "Файл.pdf" },
    );

    expect(duplicate.status).toBe(409);
    expect(blank.status).toBe(400);
    expect(unknown.status).toBe(404);
  });
});

describe("POST /files/:id/move", () => {
  it("переносит файл в другую папку", async () => {
    const { status, body } = await sendJson("POST", API_ROUTES.files.move(SEED_IDS.resume), {
      targetFolderId: SEED_IDS.documents,
    });

    expect(status).toBe(200);
    expect(fileSchema.parse(body)).toMatchObject({ folderId: SEED_IDS.documents });
  });

  it("не переносит в неизвестную папку и на дубликат имени", async () => {
    const unknownTarget = await sendJson("POST", API_ROUTES.files.move(SEED_IDS.resume), {
      targetFolderId: "ffffffff-0000-4000-8000-000000000000",
    });

    await sendJson("PATCH", API_ROUTES.files.byId(SEED_IDS.screenshot), { name: "Смета.xlsx" });

    const duplicate = await sendJson("POST", API_ROUTES.files.move(SEED_IDS.screenshot), {
      targetFolderId: SEED_IDS.reports,
    });

    expect(unknownTarget.status).toBe(404);
    expect(duplicate.status).toBe(409);
    expect(apiErrorSchema.parse(duplicate.body)).toMatchObject({ code: "CONFLICT" });
  });

  it("считает перенос в текущую папку успешным no-op", async () => {
    const { status } = await sendJson("POST", API_ROUTES.files.move(SEED_IDS.summary), {
      targetFolderId: SEED_IDS.reports,
    });

    expect(status).toBe(200);
  });
});

describe("DELETE /files/:id", () => {
  it("убирает файл в корзину и не освобождает квоту", async () => {
    const usedBefore = getDb().user.storageUsed;
    const { status } = await deleteJson(API_ROUTES.files.byId(SEED_IDS.resume));
    const trashed = getDb().trash.find((item) => item.id === SEED_IDS.resume);

    expect(status).toBe(204);
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(false);
    expect(trashItemSchema.parse(trashed)).toMatchObject({
      id: SEED_IDS.resume,
      name: "Резюме.pdf",
    });
    expect(getDb().user.storageUsed).toBe(usedBefore);
    expect((await deleteJson(API_ROUTES.files.byId(SEED_IDS.resume))).status).toBe(404);
  });
});

describe("PATCH /folders/:id", () => {
  it("переименовывает папку", async () => {
    const { status, body } = await sendJson(
      "PATCH",
      API_ROUTES.folders.byId(SEED_IDS.emptyFolder),
      { name: "Архив" },
    );

    expect(status).toBe(200);
    expect(folderSchema.parse(body)).toMatchObject({ id: SEED_IDS.emptyFolder, name: "Архив" });
  });

  it("отклоняет дубликат в том же родителе и пустое имя", async () => {
    const duplicate = await sendJson("PATCH", API_ROUTES.folders.byId(SEED_IDS.reports), {
      name: "Договоры",
    });
    const blank = await sendJson("PATCH", API_ROUTES.folders.byId(SEED_IDS.reports), { name: " " });

    expect(duplicate.status).toBe(409);
    expect(blank.status).toBe(400);
  });
});

describe("POST /folders/:id/move", () => {
  it("переносит папку с поддеревом и пересчитывает пути", async () => {
    const { status, body } = await sendJson("POST", API_ROUTES.folders.move(SEED_IDS.photos), {
      targetFolderId: SEED_IDS.documents,
    });
    const moved = folderSchema.parse(body);
    const nested = getDb().folders.find((folder) => folder.id === SEED_IDS.photos2026);

    expect(status).toBe(200);
    expect(moved).toMatchObject({ parentId: SEED_IDS.documents, depth: 1 });
    expect(moved.path).toBe(`/${SEED_IDS.documents}/${SEED_IDS.photos}/`);
    expect(nested?.path).toBe(`${moved.path}${SEED_IDS.photos2026}/`);
    expect(nested?.depth).toBe(2);
  });

  it("не переносит папку внутрь себя и на дубликат имени", async () => {
    const self = await sendJson("POST", API_ROUTES.folders.move(SEED_IDS.photos), {
      targetFolderId: SEED_IDS.photos,
    });
    const descendant = await sendJson("POST", API_ROUTES.folders.move(SEED_IDS.photos), {
      targetFolderId: SEED_IDS.photos2026,
    });

    await sendJson("POST", API_ROUTES.folders.create, { name: "Отчёты", parentId: null });

    const created = getDb().folders.find(
      (folder) => folder.name === "Отчёты" && folder.parentId === null,
    );
    const duplicate = await sendJson(
      "POST",
      API_ROUTES.folders.move(created?.id ?? "ffffffff-0000-4000-8000-000000000000"),
      { targetFolderId: SEED_IDS.documents },
    );

    expect(self.status).toBe(400);
    expect(descendant.status).toBe(400);
    expect(duplicate.status).toBe(409);
  });
});

describe("DELETE /folders/:id", () => {
  it("убирает папку с поддеревом в корзину", async () => {
    const usedBefore = getDb().user.storageUsed;
    const { status } = await deleteJson(API_ROUTES.folders.byId(SEED_IDS.documents));
    const trashedFolder = getDb().trash.find((item) => item.id === SEED_IDS.documents);

    expect(status).toBe(204);
    expect(getDb().folders.some((folder) => folder.id === SEED_IDS.documents)).toBe(false);
    expect(getDb().folders.some((folder) => folder.id === SEED_IDS.reports)).toBe(false);
    expect(getDb().files.some((file) => file.folderId === SEED_IDS.reports)).toBe(false);
    expect(getDb().trash.some((item) => item.id === SEED_IDS.summary)).toBe(true);
    expect(trashItemSchema.parse(trashedFolder)).toMatchObject({ id: SEED_IDS.documents });
    expect(getDb().user.storageUsed).toBe(usedBefore);
    expect((await deleteJson(API_ROUTES.folders.byId(SEED_IDS.documents))).status).toBe(404);
  });
});

describe("сессия", () => {
  it("без сессии файловые маршруты отвечают 401", async () => {
    await sendJson("POST", API_ROUTES.auth.logout, {});

    expect((await initUpload("Файл.txt")).status).toBe(401);
    expect((await deleteJson(API_ROUTES.files.byId(SEED_IDS.resume))).status).toBe(401);
  });
});
