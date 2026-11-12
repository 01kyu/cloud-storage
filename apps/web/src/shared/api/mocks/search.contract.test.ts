import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  apiErrorSchema,
  DEMO_USER,
  NodeType,
  searchResponseSchema,
  type Node,
} from "@cs/shared";

import { getDb } from "./db";
import { SEED_IDS } from "./seed";

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

const search = async (params: Record<string, string>): Promise<JsonResult> => {
  const query = new URLSearchParams(params).toString();

  return getJson(`${API_ROUTES.search.query}?${query}`);
};

const namesOf = (items: Node[]): string[] => items.map((item) => item.name);

beforeEach(async () => {
  await sendJson("POST", API_ROUTES.auth.login, DEMO_USER);
});

describe("GET /search", () => {
  it("находит папки и файлы по подстроке без учёта регистра", async () => {
    const byFolder = await search({ q: "ОТЧ" });
    const byFile = await search({ q: "рез" });

    expect(byFolder.status).toBe(200);
    expect(byFile.status).toBe(200);

    const folders = searchResponseSchema.parse(byFolder.body);
    const files = searchResponseSchema.parse(byFile.body);

    expect(namesOf(folders.items)).toContain("Отчёты");
    expect(namesOf(files.items)).toContain("Резюме.pdf");
    expect(folders.nextCursor).toBeNull();
  });

  it("фильтрует по типу узла", async () => {
    const folders = searchResponseSchema.parse((await search({ q: "от", type: "folder" })).body);
    const files = searchResponseSchema.parse((await search({ q: "от", type: "file" })).body);

    expect(folders.items.length).toBeGreaterThan(0);
    expect(folders.items.every((item) => item.type === NodeType.Folder)).toBe(true);
    expect(files.items.length).toBeGreaterThan(0);
    expect(files.items.every((item) => item.type === NodeType.File)).toBe(true);
    expect(namesOf(folders.items)).toContain("Отчёты");
    expect(namesOf(files.items)).not.toContain("Отчёты");
  });

  it("фильтрует по виду файла", async () => {
    const images = searchResponseSchema.parse((await search({ q: "от", kind: "image" })).body);
    const videos = searchResponseSchema.parse((await search({ q: "от", kind: "video" })).body);

    expect(namesOf(images.items)).toEqual(["Скриншот.png"]);
    expect(namesOf(videos.items)).toEqual(["Отпуск.mp4"]);
  });

  it("сортирует папки выше файлов и поддерживает пагинацию", async () => {
    const page = searchResponseSchema.parse((await search({ q: "от" })).body);

    expect(page.items[0]?.type).toBe(NodeType.Folder);

    const first = searchResponseSchema.parse((await search({ q: "от", limit: "1" })).body);

    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).not.toBeNull();

    const second = searchResponseSchema.parse(
      (await search({ q: "от", limit: "1", cursor: String(first.nextCursor) })).body,
    );

    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("не находит объекты из корзины", async () => {
    await sendJson("DELETE", API_ROUTES.files.byId(SEED_IDS.resume));

    const { body } = await search({ q: "рез" });

    expect(searchResponseSchema.parse(body).items).toHaveLength(0);
    expect(getDb().trash.some((item) => item.id === SEED_IDS.resume)).toBe(true);
  });

  it("отклоняет короткий запрос и неизвестный фильтр", async () => {
    const short = await search({ q: "я" });
    const missing = await getJson(API_ROUTES.search.query);
    const unknownType = await search({ q: "от", type: "unknown" });
    const unknownKind = await search({ q: "от", kind: "unknown" });

    expect(short.status).toBe(400);
    expect(missing.status).toBe(400);
    expect(unknownType.status).toBe(400);
    expect(unknownKind.status).toBe(400);
    expect(apiErrorSchema.parse(short.body)).toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("без сессии отвечает 401", async () => {
    await sendJson("POST", API_ROUTES.auth.logout);

    const { status, body } = await search({ q: "от" });

    expect(status).toBe(401);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "UNAUTHORIZED" });
  });
});
