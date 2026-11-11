import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";

import { server } from "../../test/msw";

import { baseQuery, getApiBaseUrl, isMockNotReady, resolveApiBaseUrl } from "./base-query";

const api = {
  signal: new AbortController().signal,
  abort: () => undefined,
  dispatch: () => undefined,
  getState: () => ({}),
  extra: undefined,
  endpoint: "test",
  type: "query" as const,
  forced: false,
};

describe("resolveApiBaseUrl", () => {
  it("разворачивает относительный путь до абсолютного URL", () => {
    expect(resolveApiBaseUrl("/api/v1", "http://localhost:3000")).toBe(
      "http://localhost:3000/api/v1",
    );
  });

  it("оставляет относительный путь без origin (SSR)", () => {
    expect(resolveApiBaseUrl("/api/v1")).toBe("/api/v1");
  });

  it("не трогает абсолютный URL", () => {
    expect(resolveApiBaseUrl("https://api.cloud.dev/v1", "http://localhost:3000")).toBe(
      "https://api.cloud.dev/v1",
    );
  });
});

describe("getApiBaseUrl", () => {
  it("в jsdom опирается на origin документа", () => {
    expect(getApiBaseUrl()).toBe(`${window.location.origin}/api/v1`);
  });
});

describe("isMockNotReady", () => {
  it("считает HTML-404 от dev-сервера признаком неготовых моков", () => {
    expect(isMockNotReady({ status: 404, data: "<!DOCTYPE html>" })).toBe(true);
    expect(isMockNotReady({ status: "FETCH_ERROR", error: "Network error" })).toBe(true);
    expect(
      isMockNotReady({
        status: "PARSING_ERROR",
        originalStatus: 404,
        data: "<!DOCTYPE html>",
        error: "Unexpected token <",
      }),
    ).toBe(true);
  });

  it("не ретраит ответы, которые уже отдал мок", () => {
    expect(isMockNotReady({ status: 404, data: { code: "NOT_FOUND" } })).toBe(false);
    expect(isMockNotReady({ status: 401, data: { code: "UNAUTHORIZED" } })).toBe(false);
  });
});

describe("baseQuery", () => {
  it("повторяет запрос, пока MSW не перехватил сеть", async () => {
    server.use(
      http.get(
        `${window.location.origin}${API_BASE_PATH}${API_ROUTES.health}`,
        () => new HttpResponse("<!doctype html><h1>404</h1>", { status: 404 }),
        { once: true },
      ),
    );

    const result = await baseQuery(API_ROUTES.health, api, {});

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ status: "ok" });
  });

  it("не повторяет запрос при ошибке от мока", async () => {
    await baseQuery(
      { url: API_ROUTES.auth.logout, method: "POST" },
      { ...api, type: "mutation" },
      {},
    );

    const result = await baseQuery(API_ROUTES.folders.root, api, {});

    expect(result.error).toMatchObject({ status: 401 });
  });
});
