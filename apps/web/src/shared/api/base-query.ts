import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { env, isMockingEnabled } from "@shared/config";

const MOCK_RETRY_ATTEMPTS = 10;
const MOCK_RETRY_DELAY_MS = 150;

/** Node-`fetch` не принимает relative URL, поэтому путь разворачиваем в абсолютный. */
export const resolveApiBaseUrl = (baseUrl: string, origin?: string): string =>
  baseUrl.startsWith("/") && origin ? new URL(baseUrl, origin).toString() : baseUrl;

export const getApiBaseUrl = (): string =>
  resolveApiBaseUrl(
    env.NEXT_PUBLIC_API_URL,
    typeof window === "undefined" ? undefined : window.location.origin,
  );

/**
 * Пока MSW не поднялся, dev-сервер отвечает HTML-404 — RTK Query отдаёт это
 * как `PARSING_ERROR` или как 404 со строкой в теле.
 */
export const isMockNotReady = (error: FetchBaseQueryError): boolean =>
  error.status === "FETCH_ERROR" ||
  error.status === "PARSING_ERROR" ||
  (error.status === 404 && typeof error.data === "string");

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: "include",
});

/** Повторяем запрос, пока service worker не перехватил сеть (только при включённых моках). */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (!isMockingEnabled) {
    return result;
  }

  for (
    let attempt = 0;
    attempt < MOCK_RETRY_ATTEMPTS && result.error && isMockNotReady(result.error);
    attempt += 1
  ) {
    await sleep(MOCK_RETRY_DELAY_MS);
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};
