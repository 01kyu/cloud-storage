import { describe, expect, it } from "vitest";

import { isNavItemActive, NAV_ITEMS } from "./nav-items";

describe("isNavItemActive", () => {
  it("подсвечивает точное совпадение", () => {
    expect(isNavItemActive("/trash", "/trash")).toBe(true);
  });

  it("подсвечивает вложенные маршруты", () => {
    expect(isNavItemActive("/files", "/files/f0000000-0000-4000-8000-000000000001")).toBe(true);
  });

  it("не подсвечивает чужие маршруты", () => {
    expect(isNavItemActive("/files", "/trash")).toBe(false);
    expect(isNavItemActive("/files", "/files-archive")).toBe(false);
  });
});

describe("NAV_ITEMS", () => {
  it("ведёт на четыре экрана приложения", () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      "/files",
      "/trash",
      "/shared",
      "/settings",
    ]);
  });
});
