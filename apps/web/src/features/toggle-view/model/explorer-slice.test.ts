import { describe, expect, it } from "vitest";

import { SortDirection, SortField } from "@cs/shared";

import {
  explorerReducer,
  initialExplorerState,
  selectSort,
  selectViewMode,
  setSortDirection,
  setSortField,
  setViewMode,
  toggleSortDirection,
} from "./explorer-slice";

describe("explorerSlice", () => {
  it("по умолчанию показывает список с сортировкой по имени", () => {
    expect(explorerReducer(undefined, { type: "init" })).toEqual(initialExplorerState);
    expect(initialExplorerState).toMatchObject({
      viewMode: "list",
      sort: { field: "name", direction: "asc" },
    });
  });

  it("переключает режим отображения", () => {
    const state = explorerReducer(initialExplorerState, setViewMode("grid"));

    expect(state.viewMode).toBe("grid");
  });

  it("меняет поле и направление сортировки", () => {
    const bySize = explorerReducer(initialExplorerState, setSortField(SortField.Size));
    const descending = explorerReducer(bySize, setSortDirection(SortDirection.Desc));

    expect(descending.sort).toEqual({ field: "size", direction: "desc" });
  });

  it("переключает направление сортировки туда и обратно", () => {
    const descending = explorerReducer(initialExplorerState, toggleSortDirection());
    const ascending = explorerReducer(descending, toggleSortDirection());

    expect(descending.sort.direction).toBe(SortDirection.Desc);
    expect(ascending.sort.direction).toBe(SortDirection.Asc);
  });

  it("отдаёт срез стора селекторами", () => {
    const state = explorerReducer(
      explorerReducer(initialExplorerState, setViewMode("grid")),
      setSortField(SortField.UpdatedAt),
    );
    const root = { explorer: state };

    expect(selectViewMode(root)).toBe("grid");
    expect(selectSort(root)).toEqual({ field: "updatedAt", direction: "asc" });
  });
});
