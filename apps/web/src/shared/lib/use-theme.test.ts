import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { readTheme, writeTheme } from "@shared/config";

import { useTheme } from "./use-theme";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("useTheme", () => {
  it("подхватывает сохранённую тему и применяет её к документу", () => {
    writeTheme("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("переключает и сохраняет тему", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
    expect(readTheme()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
