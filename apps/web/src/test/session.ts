import { getDb, MOCK_SESSION_TOKEN, saveDb } from "@shared/api/mocks";

/**
 * Открывает сессию мока напрямую в БД: в сидах сессии нет.
 *
 * Раньше здесь был настоящий `POST /auth/login` через MSW, но реальный `fetch`
 * в jsdom упирался в сеть и раз в несколько прогонов падал с `ECONNREFUSED`
 * (после теста с отменой загрузки интерцептор MSW не перехватывал запрос).
 * Сессия мока — это флаг `db.session`, поэтому сетевой вызов в подготовке тестов
 * ничего не проверяет, зато добавляет флак и время.
 *
 * Функция остаётся асинхронной: её вызывают как `await signInAsDemo()`.
 */
export const signInAsDemo = (): Promise<void> => {
  const db = getDb();

  db.session = { token: MOCK_SESSION_TOKEN };
  saveDb();

  return Promise.resolve();
};
