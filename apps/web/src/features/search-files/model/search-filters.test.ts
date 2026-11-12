import { describe, expect, it } from "vitest";

import { FileKind, NodeType } from "@cs/shared";

import {
  SEARCH_FILTERS,
  SEARCH_FILTER_LABELS,
  SearchFilter,
  searchFilterLabel,
  toSearchFilterParams,
} from "./search-filters";

describe("search-filters", () => {
  it("переводит фильтр в параметры контракта", () => {
    expect(toSearchFilterParams(SearchFilter.All)).toEqual({});
    expect(toSearchFilterParams(SearchFilter.Folder)).toEqual({ type: NodeType.Folder });
    expect(toSearchFilterParams(SearchFilter.File)).toEqual({ type: NodeType.File });
    expect(toSearchFilterParams(SearchFilter.Image)).toEqual({ kind: FileKind.Image });
    expect(toSearchFilterParams(SearchFilter.Document)).toEqual({ kind: FileKind.Document });
    expect(toSearchFilterParams(SearchFilter.Archive)).toEqual({ kind: FileKind.Archive });
  });

  it("даёт метку для каждого фильтра", () => {
    expect(SEARCH_FILTERS).toHaveLength(Object.keys(SEARCH_FILTER_LABELS).length);

    SEARCH_FILTERS.forEach((filter) => {
      expect(searchFilterLabel(filter)).toBe(SEARCH_FILTER_LABELS[filter]);
      expect(searchFilterLabel(filter)).not.toBe("");
    });
  });

  it("начинает список с «Все»", () => {
    expect(SEARCH_FILTERS[0]).toBe(SearchFilter.All);
  });
});
