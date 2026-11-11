import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("склеивает переданные классы", () => {
    expect(cn("root", "active")).toBe("root active");
  });

  it("отбрасывает falsy-значения", () => {
    expect(cn("root", false, null, undefined, "", "active")).toBe("root active");
  });

  it("возвращает пустую строку без значений", () => {
    expect(cn()).toBe("");
  });
});
