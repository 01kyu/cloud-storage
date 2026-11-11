import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  getThemeInitScript,
  prefersDark,
  readTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeTheme,
} from "./theme";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

describe("readTheme / writeTheme", () => {
  it("по умолчанию возвращает system", () => {
    expect(readTheme()).toBe("system");
  });

  it("читает сохранённую тему", () => {
    writeTheme("dark");

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readTheme()).toBe("dark");
  });

  it("игнорирует мусор в localStorage", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "neon");

    expect(readTheme()).toBe("system");
  });

  it("не падает, если storage недоступен", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(readTheme()).toBe("system");
  });
});

describe("resolveTheme / applyTheme", () => {
  it("system резолвится по prefers-color-scheme", () => {
    expect(resolveTheme("system")).toBe(prefersDark() ? "dark" : "light");
  });

  it("явная тема не зависит от системной", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });

  it("пишет data-theme на <html>", () => {
    applyTheme("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("getThemeInitScript", () => {
  it("содержит ключ хранилища и не ломает разметку", () => {
    const script = getThemeInitScript();

    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script.startsWith("(function(){")).toBe(true);
    expect(script.includes("</script>")).toBe(false);
  });
});
