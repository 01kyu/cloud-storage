import { apiErrorSchema } from "@cs/shared";

/** Тело ответа нужно `getApiErrorMessage`: запрос идёт мимо RTK Query. */
export class ApiRequestError extends Error {
  readonly data: unknown;

  constructor(data: unknown) {
    super("Запрос завершился ошибкой");
    this.name = "ApiRequestError";
    this.data = data;
  }
}

/**
 * Достаёт сообщение из контрактного `ApiError`; всё остальное (сетевой сбой,
 * HTML-заглушка dev-сервера) отдаёт запасной текст.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const parsed = apiErrorSchema.safeParse((error as { data?: unknown }).data);

  return parsed.success ? parsed.data.message : fallback;
};
