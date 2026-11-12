"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";

import { parseSort, parseViewMode, serializeSort } from "../model/explorer-params";
import {
  selectSort,
  selectViewMode,
  setSortDirection,
  setSortField,
  setViewMode,
} from "../model/explorer-slice";

import { useExplorerSelector } from "./use-explorer-selector";

const DEFAULT_SORT_PARAM = "name:asc";

/**
 * Настройки проводника живут в двух местах: срез — быстрое локальное состояние
 * для контролов, URL — переносимая ссылка (`?view=grid&sort=size:desc`).
 *
 * URL применяется один раз при открытии экрана, дальше источник истины — срез,
 * а он пишет в URL. Иначе `replace` тут же «откатывал» бы выбор пользователя:
 * параметры адресной строки обновляются асинхронно, после навигации.
 * Дефолты в параметры не попадают, поэтому `/files` остаётся коротким.
 */
export const useExplorerUrlSync = (): void => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const viewMode = useExplorerSelector(selectViewMode);
  const sort = useExplorerSelector(selectSort);

  /** Параметры на момент входа: ссылку из поиска и закладок применяем как есть. */
  const initialParams = useRef(searchParams.toString());
  const paramsString = searchParams.toString();

  useEffect(() => {
    const params = new URLSearchParams(initialParams.current);
    const urlView = params.get("view");
    const urlSort = params.get("sort");

    if (urlView) {
      dispatch(setViewMode(parseViewMode(urlView)));
    }

    if (urlSort) {
      const parsed = parseSort(urlSort);

      dispatch(setSortField(parsed.field));
      dispatch(setSortDirection(parsed.direction));
    }
  }, [dispatch]);

  const sortParam = serializeSort(sort);

  useEffect(() => {
    const params = new URLSearchParams(paramsString);
    const nextView = viewMode === "grid" ? "grid" : null;
    const nextSort = sortParam === DEFAULT_SORT_PARAM ? null : sortParam;

    if ((params.get("view") ?? null) === nextView && (params.get("sort") ?? null) === nextSort) {
      return;
    }

    if (nextView) {
      params.set("view", nextView);
    } else {
      params.delete("view");
    }

    if (nextSort) {
      params.set("sort", nextSort);
    } else {
      params.delete("sort");
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [viewMode, sortParam, paramsString, pathname, router]);
};
