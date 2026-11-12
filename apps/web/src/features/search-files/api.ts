import { API_ROUTES, type SearchQuery, type SearchResponse } from "@cs/shared";
import { rootApi } from "@shared/api";

/**
 * Поиск не кешируется «навсегда»: результат зависит от запроса, поэтому ключ
 * кеша — сам запрос и фильтры (но не `limit`: догрузка расширяет его в том же
 * кеше). Теги нужны, чтобы переименование/удаление обновляло выдачу.
 */
export const searchApi = rootApi.injectEndpoints({
  endpoints: (builder) => ({
    getSearchResults: builder.query<SearchResponse, SearchQuery>({
      query: ({ q, type, kind, cursor, limit, sort }) => ({
        url: API_ROUTES.search.query,
        params: {
          q,
          ...(type ? { type } : {}),
          ...(kind ? { kind } : {}),
          ...(cursor ? { cursor } : {}),
          ...(limit ? { limit } : {}),
          ...(sort ? { sort } : {}),
        },
      }),
      providesTags: ["Folder", "File"],
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.q}:${queryArgs.type ?? ""}:${queryArgs.kind ?? ""}:${queryArgs.sort ?? ""}`,
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.limit !== previousArg?.limit,
    }),
  }),
});

export const { useGetSearchResultsQuery } = searchApi;
