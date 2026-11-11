"use client";

import { useState } from "react";

import { NodeType, type Node } from "@cs/shared";
import { useDeleteFileMutation } from "@entities/file";
import { useDeleteFolderMutation } from "@entities/folder";
import { getApiErrorMessage } from "@shared/lib";
import { ConfirmDialog } from "@shared/ui";

export type DeleteNodeDialogProps = {
  /** `null` — диалог закрыт. */
  node: Node | null;
  onOpenChange: (open: boolean) => void;
};

/** Ошибка остаётся в описании диалога, а не уходит тостом. */
export const DeleteNodeDialog = ({ node, onOpenChange }: DeleteNodeDialogProps) => {
  const [deleteFile, { isLoading: isFileDeleting }] = useDeleteFileMutation();
  const [deleteFolder, { isLoading: isFolderDeleting }] = useDeleteFolderMutation();
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean): void => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  };

  const handleConfirm = async (): Promise<void> => {
    if (!node) {
      return;
    }

    setError(null);

    try {
      if (node.type === NodeType.File) {
        await deleteFile(node.id).unwrap();
      } else {
        await deleteFolder(node.id).unwrap();
      }

      handleOpenChange(false);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Не удалось удалить. Попробуйте ещё раз"));
    }
  };

  const isFolder = node?.type === NodeType.Folder;
  const description = error ? (
    <span role="alert">{error}</span>
  ) : node ? (
    isFolder ? (
      `«${node.name}» и всё её содержимое попадут в корзину.`
    ) : (
      `«${node.name}» попадёт в корзину — файл можно будет восстановить.`
    )
  ) : undefined;

  return (
    <ConfirmDialog
      open={node !== null}
      onOpenChange={handleOpenChange}
      tone="danger"
      title={isFolder ? "Удалить папку?" : "Удалить файл?"}
      description={description}
      confirmLabel="Удалить"
      loading={isFileDeleting || isFolderDeleting}
      onConfirm={() => void handleConfirm()}
    />
  );
};
