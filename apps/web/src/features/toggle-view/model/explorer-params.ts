import { SortDirection, SortField } from "@cs/shared";

import { initialExplorerState, type ExplorerSort, type ExplorerViewMode } from "./explorer-slice";

/** Дефолт один на срез и на URL: `name:asc` в ссылку не попадает. */
export const DEFAULT_SORT: ExplorerSort = initialExplorerState.sort;

/** `?view=` — от дефолта отличается только сетка; мусор в ссылке не ломает листинг. */
export const parseViewMode = (value: string | null): ExplorerViewMode =>
  value === "grid" ? "grid" : "list";

const isSortField = (value: string): value is SortField =>
  (Object.values(SortField) as string[]).includes(value);

/**
 * `?sort=size:desc`. Неизвестное поле или направление откатываются к дефолту:
 * ссылка приходит от пользователя, а не только из нашего UI.
 */
export const parseSort = (value: string | null): ExplorerSort => {
  const [rawField, rawDirection] = (value ?? "").split(":");
  const field = rawField && isSortField(rawField) ? rawField : DEFAULT_SORT.field;
  const direction = rawDirection === SortDirection.Desc ? SortDirection.Desc : SortDirection.Asc;

  return { field, direction };
};

export const serializeSort = ({ field, direction }: ExplorerSort): string =>
  `${field}:${direction}`;
