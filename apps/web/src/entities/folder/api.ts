import {
  API_ROUTES,
  type Breadcrumb,
  type CreateFolderPayload,
  type Folder,
  type ListResponse,
  type MoveNodePayload,
  type Node,
  type RenameNodePayload,
} from "@cs/shared";
import { rootApi } from "@shared/api";

export type FolderChildrenArgs = {
  /** `null` — корень хранилища. */
  folderId: string | null;
  cursor?: string;
  /** Серверная сортировка листинга в формате `field:direction`. */
  sort?: string;
};

export type RenameFolderArgs = RenameNodePayload & { folderId: string };

export type MoveFolderArgs = MoveNodePayload & { folderId: string };

export const folderApi = rootApi.injectEndpoints({
  endpoints: (builder) => ({
    getFolderChildren: builder.query<ListResponse<Node>, FolderChildrenArgs>({
      query: ({ folderId, cursor, sort }) => ({
        url: folderId ? API_ROUTES.folders.children(folderId) : API_ROUTES.folders.root,
        params: { ...(cursor ? { cursor } : {}), ...(sort ? { sort } : {}) },
      }),
      providesTags: ["Folder", "File"],
    }),

    getFolderTree: builder.query<Folder[], void>({
      query: () => ({ url: API_ROUTES.folders.tree }),
      providesTags: ["Folder"],
    }),

    getBreadcrumbs: builder.query<Breadcrumb[], string>({
      query: (folderId) => ({ url: API_ROUTES.folders.breadcrumbs(folderId) }),
      providesTags: ["Folder"],
    }),

    createFolder: builder.mutation<Folder, CreateFolderPayload>({
      query: (body) => ({ url: API_ROUTES.folders.create, method: "POST", body }),
      invalidatesTags: ["Folder"],
    }),

    renameFolder: builder.mutation<Folder, RenameFolderArgs>({
      query: ({ folderId, name }) => ({
        url: API_ROUTES.folders.byId(folderId),
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["Folder", "File"],
    }),

    moveFolder: builder.mutation<Folder, MoveFolderArgs>({
      query: ({ folderId, targetFolderId }) => ({
        url: API_ROUTES.folders.move(folderId),
        method: "POST",
        body: { targetFolderId },
      }),
      invalidatesTags: ["Folder", "File"],
    }),

    deleteFolder: builder.mutation<void, string>({
      query: (folderId) => ({ url: API_ROUTES.folders.byId(folderId), method: "DELETE" }),
      invalidatesTags: ["Folder", "File", "Trash", "User"],
    }),
  }),
});

export const {
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useGetBreadcrumbsQuery,
  useGetFolderChildrenQuery,
  useGetFolderTreeQuery,
  useMoveFolderMutation,
  useRenameFolderMutation,
} = folderApi;
