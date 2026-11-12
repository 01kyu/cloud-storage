"use client";

import { useState } from "react";

import type { FileItem } from "@cs/shared";
import { fetchFileBlob } from "@entities/file";
import { getApiErrorMessage, saveBlob } from "@shared/lib";
import { showErrorToast } from "@shared/ui";

export type DownloadFileState = {
  download: (file: FileItem) => Promise<void>;
  isLoading: boolean;
};

/** Ошибка скачивания уходит тостом: отдельная модалка перекрывала листинг. */
export const useDownloadFile = (): DownloadFileState => {
  const [isLoading, setIsLoading] = useState(false);

  const download = async (file: FileItem): Promise<void> => {
    setIsLoading(true);

    try {
      const blob = await fetchFileBlob(file.id);

      saveBlob(blob, file.name);
    } catch (cause) {
      showErrorToast(getApiErrorMessage(cause, "Не удалось скачать файл. Попробуйте ещё раз"));
    } finally {
      setIsLoading(false);
    }
  };

  return { download, isLoading };
};
