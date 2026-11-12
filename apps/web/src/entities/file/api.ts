import {
  API_ROUTES,
  type CopyFilePayload,
  type FileItem,
  type MoveNodePayload,
  type RenameNodePayload,
  type UploadCompletePayload,
  type UploadInitPayload,
  type UploadInitResponse,
} from "@cs/shared";
import { rootApi } from "@shared/api";

export type RenameFileArgs = RenameNodePayload & { fileId: string };

export type MoveFileArgs = MoveNodePayload & { fileId: string };

export type CopyFileArgs = CopyFilePayload & { fileId: string };

export const fileApi = rootApi.injectEndpoints({
  endpoints: (builder) => ({
    initUpload: builder.mutation<UploadInitResponse, UploadInitPayload>({
      query: (body) => ({ url: API_ROUTES.files.uploadInit, method: "POST", body }),
    }),

    completeUpload: builder.mutation<FileItem, UploadCompletePayload>({
      query: (body) => ({ url: API_ROUTES.files.uploadComplete, method: "POST", body }),
      invalidatesTags: ["File", "Folder", "User"],
    }),

    renameFile: builder.mutation<FileItem, RenameFileArgs>({
      query: ({ fileId, name }) => ({
        url: API_ROUTES.files.byId(fileId),
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    moveFile: builder.mutation<FileItem, MoveFileArgs>({
      query: ({ fileId, targetFolderId }) => ({
        url: API_ROUTES.files.move(fileId),
        method: "POST",
        body: { targetFolderId },
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    copyFile: builder.mutation<FileItem, CopyFileArgs>({
      query: ({ fileId, targetFolderId }) => ({
        url: API_ROUTES.files.copy(fileId),
        method: "POST",
        body: targetFolderId === undefined ? {} : { targetFolderId },
      }),
      /** Копия занимает место: обновляем и квоту (`User`). */
      invalidatesTags: ["File", "Folder", "User"],
    }),

    deleteFile: builder.mutation<void, string>({
      query: (fileId) => ({ url: API_ROUTES.files.byId(fileId), method: "DELETE" }),
      invalidatesTags: ["File", "Folder", "Trash", "User"],
    }),
  }),
});

export const {
  useCompleteUploadMutation,
  useCopyFileMutation,
  useDeleteFileMutation,
  useInitUploadMutation,
  useMoveFileMutation,
  useRenameFileMutation,
} = fileApi;
