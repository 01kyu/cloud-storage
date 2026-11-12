"use client";

import { useCallback, useState } from "react";

import { LIMITS } from "@cs/shared";

export type PagedListState = {
  /** Сколько элементов просить у сервера: растёт по «Показать ещё». */
  limit: number;
  /** Можно ли ещё расширять: потолок контракта — `LIMITS.maxPageSize`. */
  canExpand: boolean;
  loadMore: () => void;
};

type State = {
  scope: string;
  limit: number;
};

/**
 * Догрузка листинга расширением `limit`, а не отдельными запросами на страницу.
 *
 * Один запрос всегда идёт с начала списка: в кеше RTK Query живёт один набор
 * на область (папка+сортировка, корзина, выдача поиска), поэтому инвалидация
 * тегов после мутаций обновляет весь показанный список, а не только хвост.
 * `scope` — ключ области: его смена начинается с первой страницы, иначе
 * «Показать ещё» дотянуло бы лишние элементы в чужой список.
 *
 * Потолок — `LIMITS.maxPageSize` (ограничение серверного `limit`).
 */
export const usePagedList = (scope: string): PagedListState => {
  const [state, setState] = useState<State>({ scope, limit: LIMITS.pageSize });
  const limit = state.scope === scope ? state.limit : LIMITS.pageSize;

  const loadMore = useCallback(() => {
    setState((prev) => {
      const current = prev.scope === scope ? prev.limit : LIMITS.pageSize;

      return { scope, limit: Math.min(current + LIMITS.pageSize, LIMITS.maxPageSize) };
    });
  }, [scope]);

  return { limit, canExpand: limit < LIMITS.maxPageSize, loadMore };
};
