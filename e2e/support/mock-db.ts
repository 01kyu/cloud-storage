import type { BrowserContext, Page } from "@playwright/test";

/** Ключ мок-БД: `MOCK_DB_STORAGE_KEY` из `apps/web/src/shared/api/mocks/constants.ts`. */
const MOCK_DB_STORAGE_KEY = "cs:mock-db";

type MockDbSnapshot = { session?: unknown } & Record<string, unknown>;

/**
 * Мок держит «серверное» состояние в localStorage, поэтому у каждого контекста
 * своя копия. Гость получает ту же БД, но без сессии: данные общие, авторизации нет.
 */
export const inheritMockDb = async (source: Page, target: BrowserContext): Promise<void> => {
  const raw = await source.evaluate(
    (key) => globalThis.localStorage.getItem(key),
    MOCK_DB_STORAGE_KEY,
  );

  if (!raw) {
    throw new Error("Мок-БД не найдена: сначала войдите и создайте данные");
  }

  const db = JSON.parse(raw) as MockDbSnapshot;

  db.session = null;

  await target.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      globalThis.localStorage.setItem(key, value);
    },
    { key: MOCK_DB_STORAGE_KEY, value: JSON.stringify(db) },
  );
};

/**
 * Досыпает файлы в корень «серверной» БД, чтобы проверить догрузку листинга:
 * файлов должно быть больше `LIMITS.pageSize` (50). Вызывается после входа
 * (мок-БД уже создана) и требует перезагрузки страницы: мок держит копию БД
 * в памяти модуля.
 */
export const seedRootFiles = async (page: Page, count: number): Promise<void> => {
  await page.evaluate((total: number) => {
    const raw = globalThis.localStorage.getItem("cs:mock-db");

    if (!raw) {
      throw new Error("Мок-БД не найдена: сначала войдите, чтобы создать данные");
    }

    const db = JSON.parse(raw) as {
      files: Record<string, unknown>[];
      user?: { storageUsed?: number };
    };
    const timestamp = "2026-03-01T00:00:00.000Z";
    const size = 1024;

    for (let index = 1; index <= total; index += 1) {
      db.files.push({
        id: `b0000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        type: "file",
        name: `Файл ${String(index).padStart(2, "0")}.txt`,
        folderId: null,
        mimeType: "text/plain",
        extension: "txt",
        kind: "document",
        size,
        status: "ready",
        checksum: "0".repeat(64),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    if (db.user) {
      db.user.storageUsed = (db.user.storageUsed ?? 0) + size * total;
    }

    globalThis.localStorage.setItem("cs:mock-db", JSON.stringify(db));
  }, count);
};
