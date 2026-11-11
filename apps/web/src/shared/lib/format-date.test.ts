import { describe, expect, it } from "vitest";

import { formatDate } from "./format-date";

describe("formatDate", () => {
  it("форматирует ISO-дату по-русски", () => {
    expect(formatDate("2026-02-11T12:40:00.000Z", { timeZone: "UTC" })).toBe("11 февр. 2026 г.");
  });

  it("поддерживает другую локаль и объект Date", () => {
    expect(
      formatDate(new Date("2026-02-11T12:40:00.000Z"), { locale: "en-US", timeZone: "UTC" }),
    ).toBe("Feb 11, 2026");
  });

  it("возвращает прочерк для некорректной даты", () => {
    expect(formatDate("не дата")).toBe("—");
  });
});
