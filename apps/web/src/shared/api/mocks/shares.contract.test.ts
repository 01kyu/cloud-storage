import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  apiErrorSchema,
  createListResponseSchema,
  DEMO_USER,
  NodeType,
  publicShareSchema,
  SharePermission,
  shareSchema,
} from "@cs/shared";

import { getDb } from "./db";
import { SEED_IDS } from "./seed";

const shareListSchema = createListResponseSchema(shareSchema);

const origin = window.location.origin;

type JsonResult = { status: number; body: unknown };

const request = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${origin}${API_BASE_PATH}${path}`, init);

const readBody = async (response: Response): Promise<unknown> =>
  response.status === 204 ? null : await response.json().catch(() => null);

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

const createShare = (overrides: Record<string, unknown> = {}): Promise<JsonResult> =>
  sendJson("POST", API_ROUTES.shares.create, {
    nodeId: SEED_IDS.summary,
    nodeType: NodeType.File,
    permission: SharePermission.Download,
    ...overrides,
  });

const createToken = async (overrides: Record<string, unknown> = {}): Promise<string> => {
  const { body } = await createShare(overrides);

  return shareSchema.parse(body).token;
};

const passwordQuery = (password?: string): string =>
  password === undefined ? "" : `?password=${encodeURIComponent(password)}`;

const publicShare = (token: string, password?: string): Promise<JsonResult> =>
  getJson(`${API_ROUTES.shares.public(token)}${passwordQuery(password)}`);

const publicDownload = (token: string, password?: string): Promise<Response> =>
  request(`${API_ROUTES.shares.publicDownload(token)}${passwordQuery(password)}`);

beforeEach(async () => {
  await sendJson("POST", API_ROUTES.auth.login, DEMO_USER);
});

describe("POST /shares", () => {
  it("создаёт бессрочную ссылку без пароля", async () => {
    const { status, body } = await createShare();
    const share = shareSchema.parse(body);

    expect(status).toBe(201);
    expect(share).toMatchObject({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Download,
      hasPassword: false,
      expiresAt: null,
    });
    expect(share.token.length).toBeGreaterThanOrEqual(8);
    // Пароль не входит в контракт — наружу он не уходит.
    expect(body).not.toHaveProperty("password");
    expect(getDb().shares).toHaveLength(1);
  });

  it("помечает защищённую ссылку и не отдаёт пароль", async () => {
    const { body } = await createShare({ password: "1234" });
    const share = shareSchema.parse(body);

    expect(share.hasPassword).toBe(true);
    expect(body).not.toHaveProperty("password");
    expect(getDb().shares[0]?.password).toBe("1234");
  });

  it("отклоняет неизвестный объект, чужой тип и прошедший срок", async () => {
    const unknownNode = await createShare({ nodeId: "ffffffff-0000-4000-8000-000000000000" });
    const wrongType = await createShare({ nodeId: SEED_IDS.documents, nodeType: NodeType.File });
    const pastExpiry = await createShare({
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const shortPassword = await createShare({ password: "123" });

    expect(unknownNode.status).toBe(404);
    expect(apiErrorSchema.parse(unknownNode.body)).toMatchObject({ code: "NOT_FOUND" });
    expect(wrongType.status).toBe(400);
    expect(pastExpiry.status).toBe(400);
    expect(shortPassword.status).toBe(400);
    expect(apiErrorSchema.parse(shortPassword.body)).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(getDb().shares).toHaveLength(0);
  });

  it("без сессии отвечает 401 и не создаёт ссылку", async () => {
    await sendJson("POST", API_ROUTES.auth.logout);

    const { status, body } = await createShare();

    expect(status).toBe(401);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "UNAUTHORIZED" });
    expect(getDb().shares).toHaveLength(0);
  });
});

describe("GET /shares", () => {
  it("отдаёт список ссылок по контракту, свежие сверху", async () => {
    await createShare();
    await sendJson("POST", API_ROUTES.shares.create, {
      nodeId: SEED_IDS.documents,
      nodeType: NodeType.Folder,
      permission: SharePermission.Read,
    });

    const { status, body } = await getJson(API_ROUTES.shares.list);
    const page = shareListSchema.parse(body);

    expect(status).toBe(200);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]?.nodeType).toBe(NodeType.Folder);
    expect(page.nextCursor).toBeNull();
  });

  it("скрывает ссылку на удалённый объект", async () => {
    await createShare();
    await sendJson("DELETE", API_ROUTES.files.byId(SEED_IDS.summary));

    const { body } = await getJson(API_ROUTES.shares.list);

    expect(shareListSchema.parse(body).items).toHaveLength(0);
    // Сама запись остаётся: отзыв ссылки — отдельное действие.
    expect(getDb().shares).toHaveLength(1);
  });

  it("без сессии отвечает 401", async () => {
    await sendJson("POST", API_ROUTES.auth.logout);

    expect((await getJson(API_ROUTES.shares.list)).status).toBe(401);
  });
});

describe("DELETE /shares/:id", () => {
  it("отзывает ссылку и отвечает 404 на повторный отзыв", async () => {
    const { body } = await createShare();
    const shareId = shareSchema.parse(body).id;

    const first = await sendJson("DELETE", API_ROUTES.shares.byId(shareId));
    const second = await sendJson("DELETE", API_ROUTES.shares.byId(shareId));

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
    expect(getDb().shares).toHaveLength(0);
  });
});

describe("GET /public/shares/:token", () => {
  it("открывается без авторизации", async () => {
    const token = await createToken();
    await sendJson("POST", API_ROUTES.auth.logout);

    const { status, body } = await publicShare(token);
    const view = publicShareSchema.parse(body);

    expect(status).toBe(200);
    expect(view).toMatchObject({
      token,
      nodeName: "Итоги года.pdf",
      nodeType: NodeType.File,
      permission: SharePermission.Download,
      hasPassword: false,
    });
    expect(view.size).toBeGreaterThan(0);
  });

  it("требует пароль у защищённой ссылки", async () => {
    const token = await createToken({ password: "1234" });

    const withoutPassword = await publicShare(token);
    const wrongPassword = await publicShare(token, "0000");
    const correct = await publicShare(token, "1234");

    expect(withoutPassword.status).toBe(401);
    expect(apiErrorSchema.parse(withoutPassword.body)).toMatchObject({ code: "UNAUTHORIZED" });
    expect(wrongPassword.status).toBe(401);
    expect(correct.status).toBe(200);
  });

  it("отвечает 404 на неизвестный токен и 410 на истёкшую ссылку", async () => {
    const token = await createToken({ expiresAt: new Date(Date.now() + 60_000).toISOString() });

    expect((await publicShare(token)).status).toBe(200);

    const share = getDb().shares[0];

    if (!share) {
      throw new Error("Ссылка не попала в БД мока");
    }

    share.expiresAt = new Date(Date.now() - 60_000).toISOString();

    const afterExpiry = await publicShare(token);
    const unknown = await publicShare("unknown-token-123");

    expect(afterExpiry.status).toBe(410);
    expect(apiErrorSchema.parse(afterExpiry.body)).toMatchObject({ code: "SHARE_EXPIRED" });
    expect(unknown.status).toBe(404);
  });
});

describe("GET /public/shares/:token/download", () => {
  it("скачивает файл без сессии", async () => {
    const token = await createToken();
    await sendJson("POST", API_ROUTES.auth.logout);

    const response = await publicDownload(token);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(text).toContain("Итоги года.pdf");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("запрещает скачивание по ссылке с правом просмотра", async () => {
    const token = await createToken({ permission: SharePermission.Read });

    const response = await publicDownload(token);

    expect(response.status).toBe(403);
    expect(apiErrorSchema.parse(await response.json())).toMatchObject({ code: "FORBIDDEN" });
  });

  it("не отдаёт папку и требует пароль", async () => {
    const folderToken = await createToken({
      nodeId: SEED_IDS.documents,
      nodeType: NodeType.Folder,
    });
    const lockedToken = await createToken({ password: "1234" });

    const folder = await publicDownload(folderToken);
    const locked = await publicDownload(lockedToken);
    const unlocked = await publicDownload(lockedToken, "1234");

    expect(folder.status).toBe(400);
    expect(locked.status).toBe(401);
    expect(unlocked.status).toBe(200);
  });
});
