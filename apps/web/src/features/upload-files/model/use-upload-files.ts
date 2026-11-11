"use client";

import { useCallback } from "react";
import { useDispatch } from "react-redux";

import { LIMITS } from "@cs/shared";
import { useCompleteUploadMutation, useInitUploadMutation } from "@entities/file";
import { getApiErrorMessage } from "@shared/lib";

import {
  isFinishedUpload,
  selectUploads,
  uploadCanceled,
  uploadDismissed,
  uploadFailed,
  uploadProgressed,
  uploadSucceeded,
  uploadStarted,
  uploadsCleared,
  uploadsQueued,
  type UploadItem,
} from "./upload-queue-slice";
import {
  abortUpload,
  fileChecksum,
  putFileBody,
  registerUploadController,
  releaseUploadController,
} from "./upload-transport";
import { useUploadQueueSelector } from "./use-upload-queue-selector";

/** Прогресс по этапам контракта: init → тело → complete. */
const PROGRESS_AFTER_INIT = 30;
const PROGRESS_AFTER_BODY = 80;

const MAX_BATCH_MESSAGE = `За раз можно загрузить не больше ${LIMITS.maxUploadBatchSize} файлов`;

const newUploadId = (): string => crypto.randomUUID();

const isAborted = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name?: string }).name === "AbortError";

export type UploadFilesApi = {
  startUpload: (files: File[]) => void;
  isUploading: boolean;
};

/**
 * Последовательная загрузка: прогресс и отмена предсказуемы, а пачка
 * не превращается в десятки параллельных запросов.
 */
export const useUploadFiles = (folderId: string | null): UploadFilesApi => {
  const dispatch = useDispatch();
  const [initUpload] = useInitUploadMutation();
  const [completeUpload] = useCompleteUploadMutation();
  const items = useUploadQueueSelector(selectUploads);

  const uploadOne = useCallback(
    async (file: File, id: string): Promise<void> => {
      const controller = registerUploadController(id);

      dispatch(uploadStarted(id));

      try {
        const init = await initUpload({
          name: file.name,
          folderId,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        }).unwrap();

        dispatch(uploadProgressed({ id, progress: PROGRESS_AFTER_INIT }));

        await putFileBody(init.uploadUrl, file, controller.signal);
        dispatch(uploadProgressed({ id, progress: PROGRESS_AFTER_BODY }));

        await completeUpload({ fileId: init.file.id, checksum: fileChecksum(file) }).unwrap();
        dispatch(uploadSucceeded(id));
      } catch (error) {
        if (isAborted(error) || controller.signal.aborted) {
          dispatch(uploadCanceled(id));
        } else {
          dispatch(
            uploadFailed({ id, message: getApiErrorMessage(error, "Не удалось загрузить файл") }),
          );
        }
      } finally {
        releaseUploadController(id);
      }
    },
    [completeUpload, dispatch, folderId, initUpload],
  );

  const startUpload = useCallback(
    (files: File[]): void => {
      const batch = files.slice(0, LIMITS.maxUploadBatchSize);
      const tasks = batch.map((file) => ({ id: newUploadId(), file }));
      const queued = tasks.map(({ id, file }) => ({ id, name: file.name, size: file.size }));

      if (tasks.length === 0) {
        return;
      }

      dispatch(uploadsQueued(queued));

      if (files.length > tasks.length) {
        const overflowId = newUploadId();

        dispatch(uploadsQueued([{ id: overflowId, name: "Остальные файлы", size: 0 }]));
        dispatch(uploadFailed({ id: overflowId, message: MAX_BATCH_MESSAGE }));
      }

      void tasks.reduce<Promise<void>>(
        (chain, task) => chain.then(() => uploadOne(task.file, task.id)),
        Promise.resolve(),
      );
    },
    [dispatch, uploadOne],
  );

  return {
    startUpload,
    isUploading: items.some((item) => !isFinishedUpload(item)),
  };
};

export type UploadQueueApi = {
  items: UploadItem[];
  cancel: (id: string) => void;
  dismiss: (id: string) => void;
  clearFinished: () => void;
};

export const useUploadQueue = (): UploadQueueApi => {
  const dispatch = useDispatch();
  const items = useUploadQueueSelector(selectUploads);

  return {
    items,
    cancel: (id: string) => {
      abortUpload(id);
      dispatch(uploadCanceled(id));
    },
    dismiss: (id: string) => {
      dispatch(uploadDismissed(id));
    },
    clearFinished: () => {
      dispatch(uploadsCleared());
    },
  };
};
