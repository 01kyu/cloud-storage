import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  apiErrorSchema,
  breadcrumbSchema,
  createListResponseSchema,
  DEMO_USER,
  folderSchema,
  nodeSchema,
  userSchema,
} from "@cs/shared";

import { getDb } from "./db";
import { createSeedDb, SEED_IDS } from "./seed";

const nodeListSchema = createListResponseSchema(nodeSchema);

const origin = window.location.origin;

const request = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${origin}${API_BASE_PATH}${path}`, init);

const getJson = async (path: string): Promise<{ status: number; body: unknown }> => {
  const response = await request(path);

  return { status: response.status, body: response.status === 204 ? null : await response.json() };
};

const postJson = async (
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown }> => {
  const response = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return { status: response.status, body: response.status === 204 ? null : await response.json() };
};

/** Сиды сессии не открывают, поэтому сначала входим демо-пользователем. */
beforeEach(async () => {
  await postJson(API_ROUTES.auth.login, DEMO_USER);
});

describe("сиды мока", () => {
  it("согласованы: пути папок, глубины и размер поддерева", () => {
    const db = getDb();
    const byId = new Map(db.folders.map((folder) => [folder.id, folder]));

    db.folders.forEach((folder) => {
      expect(folderSchema.parse(folder)).toBeTruthy();
      expect(folder.path.endsWith(`/${folder.id}/`)).toBe(true);
    });

    const nestedFolders = db.folders.filter((folder) => folder.parentId !== null);

    nestedFolders.forEach((folder) => {
      const parent = byId.get(folder.parentId ?? "");

      expect(parent).toBeDefined();
      expect(folder.path).toBe(`${parent?.path}${folder.id}/`);
      expect(folder.depth).toBe((parent?.depth ?? 0) + 1);
    });

    const rootFolders = db.folders.filter((folder) => folder.parentId === null);

    rootFolders.forEach((folder) => {
      expect(folder.path).toBe(`/${folder.id}/`);
      expect(folder.depth).toBe(0);
    });
  });

  it("каждый файл лежит в существующей папке или корне", () => {
    const db = getDb();
    const folderIds = new Set(db.folders.map((folder) => folder.id));
    const nestedFiles = db.files.filter((file) => file.folderId !== null);

    db.files.forEach((file) => {
      expect(nodeSchema.parse(file)).toBeTruthy();
    });

    nestedFiles.forEach((file) => {
      expect(folderIds.has(file.folderId ?? "")).toBe(true);
    });
  });

  it("квота пользователя равна сумме размеров файлов", () => {
    const db = getDb();
    const total = db.files.reduce((sum, file) => sum + file.size, 0);

    expect(db.user.storageUsed).toBe(total);
    expect(userSchema.parse(db.user)).toBeTruthy();
  });

  it("есть папка без вложений — для пустого состояния", () => {
    const db = getDb();
    const emptyFolder = db.folders.find((folder) => folder.id === SEED_IDS.emptyFolder);

    expect(emptyFolder?.childCount).toBe(0);
  });

  it("не открывают сессию — вход возможен только через форму", () => {
    expect(createSeedDb().session).toBeNull();
  });
});

describe("GET /folders", () => {
  it("отдаёт листинг корня по контракту", async () => {
    const { status, body } = await getJson(API_ROUTES.folders.root);
    const parsed = nodeListSchema.parse(body);

    expect(status).toBe(200);
    expect(parsed.items.length).toBeGreaterThan(0);
    expect(parsed.nextCursor).toBeNull();

    const parentIds = parsed.items.map((node) =>
      node.type === "folder" ? node.parentId : node.folderId,
    );

    expect(parentIds.every((parentId) => parentId === null)).toBe(true);
  });

  it("сортирует папки выше файлов", async () => {
    const { body } = await getJson(API_ROUTES.folders.root);
    const types = nodeListSchema.parse(body).items.map((node) => node.type);

    expect(types.indexOf("file")).toBeGreaterThan(types.lastIndexOf("folder"));
  });

  it("поддерживает курсорную пагинацию", async () => {
    const first = nodeListSchema.parse((await getJson(`${API_ROUTES.folders.root}?limit=2`)).body);
    const second = nodeListSchema.parse(
      (await getJson(`${API_ROUTES.folders.root}?limit=2&cursor=${first.nextCursor}`)).body,
    );

    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBe("2");
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("принимает сортировку по размеру", async () => {
    const { body } = await getJson(`${API_ROUTES.folders.root}?sort=size:desc`);
    const items = nodeListSchema.parse(body).items;
    const sizesOf = (type: "folder" | "file"): number[] =>
      items.filter((node) => node.type === type).map((node) => node.size);

    expect(sizesOf("folder")).toEqual([...sizesOf("folder")].sort((a, b) => b - a));
    expect(sizesOf("file")).toEqual([...sizesOf("file")].sort((a, b) => b - a));
  });
});

describe("GET /folders/:id/children", () => {
  it("отдаёт только прямых детей папки", async () => {
    const { status, body } = await getJson(API_ROUTES.folders.children(SEED_IDS.documents));
    const parsed = nodeListSchema.parse(body);

    expect(status).toBe(200);

    parsed.items.forEach((node) => {
      const parentId = node.type === "folder" ? node.parentId : node.folderId;

      expect(parentId).toBe(SEED_IDS.documents);
    });
  });

  it("возвращает 404 по контракту ApiError", async () => {
    const { status, body } = await getJson(
      API_ROUTES.folders.children("ffffffff-0000-4000-8000-000000000000"),
    );

    expect(status).toBe(404);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("GET /folders/tree", () => {
  it("отдаёт плоский список всех папок, отсортированный по пути", async () => {
    const { status, body } = await getJson(API_ROUTES.folders.tree);
    const parsed = folderSchema.array().parse(body);
    const db = getDb();
    const paths = parsed.map((folder) => folder.path);

    expect(status).toBe(200);
    expect(parsed).toHaveLength(db.folders.length);
    expect(paths).toEqual([...paths].sort((a, b) => a.localeCompare(b)));
  });
});

describe("GET /folders/:id/breadcrumbs", () => {
  it("строит путь от корня к папке", async () => {
    const { status, body } = await getJson(API_ROUTES.folders.breadcrumbs(SEED_IDS.photos2026));
    const parsed = breadcrumbSchema.array().parse(body);

    expect(status).toBe(200);
    expect(parsed.map((crumb) => crumb.name)).toEqual(["Фотографии", "2026"]);
  });

  it("для папки верхнего уровня отдаёт одну крошку", async () => {
    const { body } = await getJson(API_ROUTES.folders.breadcrumbs(SEED_IDS.music));

    expect(breadcrumbSchema.array().parse(body)).toHaveLength(1);
  });
});

describe("POST /folders", () => {
  it("создаёт папку и отдаёт её по контракту", async () => {
    const parentBefore = getDb().folders.find((folder) => folder.id === SEED_IDS.documents);
    const childCountBefore = parentBefore?.childCount ?? 0;

    const { status, body } = await postJson(API_ROUTES.folders.create, {
      name: "Проекты",
      parentId: SEED_IDS.documents,
    });

    const folder = folderSchema.parse(body);
    const parentAfter = getDb().folders.find((item) => item.id === SEED_IDS.documents);

    expect(status).toBe(201);
    expect(folder).toMatchObject({
      name: "Проекты",
      parentId: SEED_IDS.documents,
      depth: 1,
      childCount: 0,
      size: 0,
    });
    expect(folder.path).toBe(`${parentBefore?.path}${folder.id}/`);
    expect(parentAfter?.childCount).toBe(childCountBefore + 1);
  });

  it("создаёт папку в корне и добавляет её в листинг и дерево", async () => {
    const { body } = await postJson(API_ROUTES.folders.create, { name: "Проекты", parentId: null });
    const folder = folderSchema.parse(body);

    const children = nodeListSchema.parse(
      (await getJson(`${API_ROUTES.folders.root}?limit=100`)).body,
    );
    const tree = folderSchema.array().parse((await getJson(API_ROUTES.folders.tree)).body);

    expect(folder).toMatchObject({ parentId: null, depth: 0, path: `/${folder.id}/` });
    expect(children.items.map((node) => node.id)).toContain(folder.id);
    expect(tree.map((item) => item.id)).toContain(folder.id);
  });

  it("обрезает пробелы в названии", async () => {
    const { status, body } = await postJson(API_ROUTES.folders.create, {
      name: "  Проекты  ",
      parentId: null,
    });

    expect(status).toBe(201);
    expect(folderSchema.parse(body).name).toBe("Проекты");
  });

  it("отклоняет дубликат имени в одной папке без учёта регистра", async () => {
    await postJson(API_ROUTES.folders.create, { name: "Проекты", parentId: null });

    const duplicate = await postJson(API_ROUTES.folders.create, {
      name: "проекты",
      parentId: null,
    });
    const sameNameElsewhere = await postJson(API_ROUTES.folders.create, {
      name: "Документы",
      parentId: SEED_IDS.music,
    });

    expect(duplicate.status).toBe(409);
    expect(apiErrorSchema.parse(duplicate.body)).toMatchObject({ code: "CONFLICT" });
    expect(sameNameElsewhere.status).toBe(201);
  });

  it("отклоняет пустое имя и некорректное тело", async () => {
    const blankName = await postJson(API_ROUTES.folders.create, { name: "   ", parentId: null });
    const invalidParent = await postJson(API_ROUTES.folders.create, {
      name: "Проекты",
      parentId: "1",
    });

    expect(blankName.status).toBe(400);
    expect(apiErrorSchema.parse(blankName.body)).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(invalidParent.status).toBe(400);
  });

  it("возвращает 404 для несуществующей родительской папки", async () => {
    const { status, body } = await postJson(API_ROUTES.folders.create, {
      name: "Проекты",
      parentId: "ffffffff-0000-4000-8000-000000000000",
    });

    expect(status).toBe(404);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "NOT_FOUND" });
  });

  it("без сессии отвечает 401 и не создаёт папку", async () => {
    await postJson(API_ROUTES.auth.logout, {});

    const before = getDb().folders.length;
    const { status, body } = await postJson(API_ROUTES.folders.create, {
      name: "Проекты",
      parentId: null,
    });

    expect(status).toBe(401);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "UNAUTHORIZED" });
    expect(getDb().folders).toHaveLength(before);
  });
});

describe("auth", () => {
  it("GET /auth/me отдаёт пользователя по контракту", async () => {
    const { status, body } = await getJson(API_ROUTES.auth.me);
    const user = userSchema.parse(body);

    expect(status).toBe(200);
    expect(user.email).toBe(DEMO_USER.email);
    expect(user).not.toHaveProperty("password");
  });

  it("после logout закрывает доступ к данным", async () => {
    await postJson(API_ROUTES.auth.logout, {});

    const me = await getJson(API_ROUTES.auth.me);
    const folders = await getJson(API_ROUTES.folders.root);

    expect(me.status).toBe(401);
    expect(apiErrorSchema.parse(me.body)).toMatchObject({ code: "UNAUTHORIZED" });
    expect(folders.status).toBe(401);
  });

  it("логин демо-пользователем возвращает сессию", async () => {
    await postJson(API_ROUTES.auth.logout, {});

    const login = await postJson(API_ROUTES.auth.login, DEMO_USER);
    const payload = login.body as { user: unknown; accessToken: string };

    expect(login.status).toBe(200);
    expect(userSchema.parse(payload.user)).toBeTruthy();
    expect(payload.accessToken).toBeTruthy();
    expect((await getJson(API_ROUTES.auth.me)).status).toBe(200);
  });

  it("отклоняет неверный пароль и некорректное тело", async () => {
    const wrongPassword = await postJson(API_ROUTES.auth.login, {
      email: DEMO_USER.email,
      password: "wrong-password",
    });
    const invalidBody = await postJson(API_ROUTES.auth.login, { email: "not-an-email" });

    expect(wrongPassword.status).toBe(401);
    expect(apiErrorSchema.parse(wrongPassword.body)).toMatchObject({ code: "UNAUTHORIZED" });
    expect(invalidBody.status).toBe(400);
    expect(apiErrorSchema.parse(invalidBody.body)).toMatchObject({ code: "VALIDATION_FAILED" });
  });
});

describe("неизвестный маршрут", () => {
  it("отвечает 404 по контракту ApiError", async () => {
    const { status, body } = await getJson("/unknown-route");

    expect(status).toBe(404);
    expect(apiErrorSchema.parse(body)).toMatchObject({ code: "NOT_FOUND" });
  });
});
