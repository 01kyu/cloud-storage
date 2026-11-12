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
