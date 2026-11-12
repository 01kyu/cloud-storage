"use client";

import { NodeType, type Node } from "@cs/shared";
import { useDeleteFileMutation } from "@entities/file";
import { useDeleteFolderMutation } from "@entities/folder";
import { getApiErrorMessage } from "@shared/lib";
import { ConfirmDialog, showErrorToast, showSuccessToast } from "@shared/ui";

export type DeleteNodeDialogProps = {
  /** `null` — диалог закрыт. */
  node: Node | null;
  onOpenChange: (open: boolean) => void;
};

/** Итог удаления сообщает тост: диалог закрывается и не должен нести состояние ошибки. */
export const DeleteNodeDialog = ({ node, onOpenChange }: DeleteNodeDialogProps) => {
  const [deleteFile, { isLoading: isFileDeleting }] = useDeleteFileMutation();
  const [deleteFolder, { isLoading: isFolderDeleting }] = useDeleteFolderMutation();

  const handleConfirm = async (): Promise<void> => {
    if (!node) {
      return;
    }

    try {
      if (node.type === NodeType.File) {
        await deleteFile(node.id).unwrap();
      } else {
        await deleteFolder(node.id).unwrap();
      }

      showSuccessToast(`«${node.name}» в корзине`);
      onOpenChange(false);
    } catch (cause) {
      showErrorToast(getApiErrorMessage(cause, "Не удалось удалить. Попробуйте ещё раз"));
    }
  };

  const isFolder = node?.type === NodeType.Folder;
  const description = node
    ? isFolder
      ? `«${node.name}» и всё её содержимое попадут в корзину.`
      : `«${node.name}» попадёт в корзину — файл можно будет восстановить.`
    : undefined;

  return (
    <ConfirmDialog
      open={node !== null}
      onOpenChange={onOpenChange}
      tone="danger"
      title={isFolder ? "Удалить папку?" : "Удалить файл?"}
      description={description}
      confirmLabel="Удалить"
      loading={isFileDeleting || isFolderDeleting}
      onConfirm={() => void handleConfirm()}
    />
  );
};
