import { describe, expect, it } from "vitest";

import { SortDirection, SortField } from "@cs/shared";

import { DEFAULT_SORT, parseSort, parseViewMode, serializeSort } from "./explorer-params";

describe("parseViewMode", () => {
  it("понимает только сетку, остальное — список", () => {
    expect(parseViewMode("grid")).toBe("grid");
    expect(parseViewMode("list")).toBe("list");
    expect(parseViewMode("table")).toBe("list");
    expect(parseViewMode(null)).toBe("list");
  });
});

describe("parseSort", () => {
  it("разбирает поле и направление", () => {
    expect(parseSort("size:desc")).toEqual({
      field: SortField.Size,
      direction: SortDirection.Desc,
    });
  });

  it("откатывается к дефолту на неизвестных значениях", () => {
    expect(parseSort("unknown:desc")).toEqual({
      field: DEFAULT_SORT.field,
      direction: SortDirection.Desc,
    });
    expect(parseSort("size:sideways")).toEqual({
      field: SortField.Size,
      direction: SortDirection.Asc,
    });
    expect(parseSort(null)).toEqual(DEFAULT_SORT);
  });
});

describe("serializeSort", () => {
  it("собирает параметр в формате контракта", () => {
    expect(serializeSort({ field: SortField.UpdatedAt, direction: SortDirection.Desc })).toBe(
      "updatedAt:desc",
    );
  });
});
