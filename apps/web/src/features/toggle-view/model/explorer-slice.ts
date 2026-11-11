import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { SortDirection, SortField } from "@cs/shared";

export type ExplorerViewMode = "list" | "grid";

export type ExplorerSort = {
  field: SortField;
  direction: SortDirection;
};

export type ExplorerState = {
  viewMode: ExplorerViewMode;
  sort: ExplorerSort;
};

export const initialExplorerState: ExplorerState = {
  viewMode: "list",
  sort: { field: SortField.Name, direction: SortDirection.Asc },
};

/** UI-предпочтение, поэтому не в URL; источник данных — серверный листинг. */
export const explorerSlice = createSlice({
  name: "explorer",
  initialState: initialExplorerState,
  reducers: {
    setViewMode(state, action: PayloadAction<ExplorerViewMode>) {
      state.viewMode = action.payload;
    },

    setSortField(state, action: PayloadAction<SortField>) {
      state.sort.field = action.payload;
    },

    setSortDirection(state, action: PayloadAction<SortDirection>) {
      state.sort.direction = action.payload;
    },

    toggleSortDirection(state) {
      state.sort.direction =
        state.sort.direction === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
    },
  },
});

export const { setSortDirection, setSortField, setViewMode, toggleSortDirection } =
  explorerSlice.actions;

export const explorerReducer = explorerSlice.reducer;

export type ExplorerRootState = {
  explorer: ExplorerState;
};

export const selectViewMode = (state: ExplorerRootState): ExplorerViewMode =>
  state.explorer.viewMode;

export const selectSort = (state: ExplorerRootState): ExplorerSort => state.explorer.sort;

export const serializeSort = ({ field, direction }: ExplorerSort): string =>
  `${field}:${direction}`;
