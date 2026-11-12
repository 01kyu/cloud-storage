import {
  API_ROUTES,
  type ListResponse,
  type Node,
  type PurgeTrashPayload,
  type TrashItem,
} from "@cs/shared";
import { rootApi } from "@shared/api";

export type TrashQueryArgs = {
  cursor?: string;
};

/**
 * Корзина — единственное место, где `User` инвалидируется вместе с `Trash`:
 * purge освобождает квоту, restore её сохраняет.
 */
export const trashApi = rootApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrash: builder.query<ListResponse<TrashItem>, TrashQueryArgs | void>({
      query: (args) => ({
        url: API_ROUTES.trash.list,
        params: args?.cursor ? { cursor: args.cursor } : undefined,
      }),
      providesTags: ["Trash"],
    }),

    restoreNode: builder.mutation<Node, string>({
      query: (nodeId) => ({ url: API_ROUTES.trash.restore(nodeId), method: "POST" }),
      invalidatesTags: ["Trash", "Folder", "File", "User"],
    }),

    purgeNode: builder.mutation<void, string>({
      query: (nodeId) => ({ url: API_ROUTES.trash.byId(nodeId), method: "DELETE" }),
      invalidatesTags: ["Trash", "User"],
    }),

    purgeTrash: builder.mutation<void, PurgeTrashPayload>({
      query: (body) => ({ url: API_ROUTES.trash.purge, method: "POST", body }),
      invalidatesTags: ["Trash", "User"],
    }),
  }),
});

export const {
  useGetTrashQuery,
  usePurgeNodeMutation,
  usePurgeTrashMutation,
  useRestoreNodeMutation,
} = trashApi;
