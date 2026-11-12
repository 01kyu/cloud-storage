import {
  API_ROUTES,
  type CreateSharePayload,
  type ListResponse,
  type PublicShare,
  type Share,
} from "@cs/shared";
import { rootApi } from "@shared/api";

export type ShareQueryArgs = {
  /** Сколько элементов вернуть: «Показать ещё» расширяет это значение. */
  limit?: number;
};

export type PublicShareArgs = {
  token: string;
  /** Приходит из формы: защищённая ссылка без него отвечает 401. */
  password?: string;
};

/**
 * Список и мутации живут в одном теге `Share`: создание и отзыв обновляют
 * страницу «Общий доступ», а публичный запрос тегов не требует — он не часть
 * пользовательского кеша.
 */
export const shareApi = rootApi.injectEndpoints({
  endpoints: (builder) => ({
    getShares: builder.query<ListResponse<Share>, ShareQueryArgs | void>({
      query: (args) => ({
        url: API_ROUTES.shares.list,
        params: args?.limit ? { limit: args.limit } : undefined,
      }),
      providesTags: ["Share"],
      /** Догрузка расширяет `limit`, поэтому кеш у списка ссылок один. */
      serializeQueryArgs: ({ endpointName }) => endpointName,
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.limit !== previousArg?.limit,
    }),

    createShare: builder.mutation<Share, CreateSharePayload>({
      query: (body) => ({ url: API_ROUTES.shares.create, method: "POST", body }),
      invalidatesTags: ["Share"],
    }),

    deleteShare: builder.mutation<void, string>({
      query: (shareId) => ({ url: API_ROUTES.shares.byId(shareId), method: "DELETE" }),
      invalidatesTags: ["Share"],
    }),

    getPublicShare: builder.query<PublicShare, PublicShareArgs>({
      query: ({ token, password }) => ({
        url: API_ROUTES.shares.public(token),
        params: password ? { password } : undefined,
      }),
    }),
  }),
});

export const {
  useCreateShareMutation,
  useDeleteShareMutation,
  useGetPublicShareQuery,
  useGetSharesQuery,
} = shareApi;
