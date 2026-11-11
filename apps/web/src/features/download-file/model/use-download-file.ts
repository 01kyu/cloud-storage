"use client";

import { useState } from "react";

import type { FileItem } from "@cs/shared";
import { fetchFileBlob } from "@entities/file";
import { getApiErrorMessage, saveBlob } from "@shared/lib";

export type DownloadFileState = {
  download: (file: FileItem) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  dismissError: () => void;
};

export const useDownloadFile = (): DownloadFileState => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async (file: FileItem): Promise<void> => {
    setError(null);
    setIsLoading(true);

    try {
      const blob = await fetchFileBlob(file.id);

      saveBlob(blob, file.name);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Не удалось скачать файл. Попробуйте ещё раз"));
    } finally {
      setIsLoading(false);
    }
  };

  return { download, isLoading, error, dismissError: () => setError(null) };
};
