"use client";

import type { FileItem } from "@cs/shared";
import { useCopyFileMutation } from "@entities/file";
import { getApiErrorMessage } from "@shared/lib";
import { showErrorToast, showSuccessToast } from "@shared/ui";

export type CopyFileState = {
  /** Копия создаётся рядом с оригиналом: имя с суффиксом подбирает сервер. */
  copy: (file: FileItem) => Promise<void>;
  isCopying: boolean;
};

/**
 * Копирование файла без диалога: подтверждать нечего, а результат виден в
 * листинге. Итоговое имя приходит в ответе — его и показываем тостом.
 */
export const useCopyFile = (): CopyFileState => {
  const [copyFile, { isLoading }] = useCopyFileMutation();

  const copy = async (file: FileItem): Promise<void> => {
    try {
      const created = await copyFile({ fileId: file.id }).unwrap();

      showSuccessToast(`Создана копия «${created.name}»`);
    } catch (cause) {
      showErrorToast(getApiErrorMessage(cause, "Не удалось скопировать файл. Попробуйте ещё раз"));
    }
  };

  return { copy, isCopying: isLoading };
};
