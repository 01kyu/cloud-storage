"use client";

import { skipToken } from "@reduxjs/toolkit/query";

import { LIMITS } from "@cs/shared";
import { useDebouncedValue, usePagedList } from "@shared/lib";

import { useGetSearchResultsQuery } from "../api";

import { toSearchFilterParams, type SearchFilter } from "./search-filters";

/** Пауза в наборе: запрос не уходит на каждый символ. */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Хук палитры: дебаунс + `skipToken` до минимальной длины + догрузка.
 * Пока запрос не набрал `LIMITS.searchQueryMinLength`, сеть не трогаем;
 * смена запроса или фильтра начинает выдачу заново (свой `scope`).
 */
export const useSearch = (term: string, filter: SearchFilter) => {
  const debouncedTerm = useDebouncedValue(term.trim(), SEARCH_DEBOUNCE_MS);
  const isReady = debouncedTerm.length >= LIMITS.searchQueryMinLength;
  const filterParams = toSearchFilterParams(filter);
  const { limit, canExpand, loadMore } = usePagedList(`${debouncedTerm}:${filter}`);

  const { data, isFetching, isError, refetch } = useGetSearchResultsQuery(
    isReady ? { q: debouncedTerm, ...filterParams, limit } : skipToken,
  );

  return {
    results: data?.items ?? [],
    hasMore: canExpand && Boolean(data?.nextCursor),
    isReady,
    isFetching,
    isError,
    loadMore,
    refetch,
  };
};
