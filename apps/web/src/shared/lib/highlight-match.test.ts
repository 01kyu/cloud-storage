import { describe, expect, it } from "vitest";

import { highlightMatch } from "./highlight-match";

describe("highlightMatch", () => {
  it("без запроса возвращает строку одним куском", () => {
    expect(highlightMatch("Смета.xlsx", "")).toEqual([{ text: "Смета.xlsx", match: false }]);
    expect(highlightMatch("Смета.xlsx", "   ")).toEqual([{ text: "Смета.xlsx", match: false }]);
  });

  it("помечает совпадение в начале, середине и конце", () => {
    expect(highlightMatch("смета-смета", "смета")).toEqual([
      { text: "смета", match: true },
      { text: "-", match: false },
      { text: "смета", match: true },
    ]);
  });

  it("не зависит от регистра и пробелов в запросе", () => {
    expect(highlightMatch("СМЕТА.xlsx", "  смет ")).toEqual([
      { text: "СМЕТ", match: true },
      { text: "А.xlsx", match: false },
    ]);
  });

  it("возвращает один кусок, если совпадения нет", () => {
    expect(highlightMatch("Смета.xlsx", "отчёт")).toEqual([{ text: "Смета.xlsx", match: false }]);
  });

  it("работает с совпадением в конце строки", () => {
    expect(highlightMatch("файл.txt", "txt")).toEqual([
      { text: "файл.", match: false },
      { text: "txt", match: true },
    ]);
  });
});
