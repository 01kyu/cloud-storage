"use client";

import { useEffect, useMemo, useState } from "react";
import { Folder as FolderIcon, HardDrive } from "lucide-react";

import { NodeType, type Folder, type Node } from "@cs/shared";
import { useMoveFileMutation } from "@entities/file";
import {
  buildFolderTree,
  useGetFolderTreeQuery,
  useMoveFolderMutation,
  type FolderTreeNode,
} from "@entities/folder";
import { getApiErrorMessage } from "@shared/lib";
import { Button, Modal, ModalContent, showErrorToast, Tree, type TreeItem } from "@shared/ui";

import styles from "./move-node-dialog.module.scss";

/** Корень хранилища в дереве выбора: настоящего id у него нет. */
const ROOT_ID = "__root__";

const toFolderItems = (nodes: FolderTreeNode[]): TreeItem[] =>
  nodes.map((item) => ({
    id: item.id,
    label: item.name,
    icon: <FolderIcon size={16} aria-hidden="true" />,
    children: toFolderItems(item.children),
  }));

const toTreeItems = (folders: Folder[], excluded: Set<string>): TreeItem[] => [
  {
    id: ROOT_ID,
    label: "Все файлы",
    icon: <HardDrive size={16} aria-hidden="true" />,
    children: toFolderItems(buildFolderTree(folders.filter((item) => !excluded.has(item.id)))),
  },
];

/** Папку нельзя перенести внутрь себя — исключаем её и всё поддерево. */
const excludedIds = (folders: Folder[], node: Node | null): Set<string> => {
  if (!node || node.type !== NodeType.Folder) {
    return new Set<string>();
  }

  const folder = folders.find((item) => item.id === node.id);

  if (!folder) {
    return new Set([node.id]);
  }

  return new Set(
    folders.filter((item) => item.path.startsWith(folder.path)).map((item) => item.id),
  );
};

const parentIdOf = (node: Node): string | null =>
  node.type === NodeType.Folder ? node.parentId : node.folderId;

export type MoveNodeDialogProps = {
  /** `null` — диалог закрыт. */
  node: Node | null;
  onOpenChange: (open: boolean) => void;
};

/** Корень — отдельный узел дерева; кнопка неактивна, пока цель совпадает с текущим родителем. */
export const MoveNodeDialog = ({ node, onOpenChange }: MoveNodeDialogProps) => {
  const { data: folders = [], isLoading } = useGetFolderTreeQuery(undefined, {
    skip: node === null,
  });
  const [moveFile, { isLoading: isFileMoving }] = useMoveFileMutation();
  const [moveFolder, { isLoading: isFolderMoving }] = useMoveFolderMutation();
  const [targetId, setTargetId] = useState<string>(ROOT_ID);

  useEffect(() => {
    if (node) {
      setTargetId(parentIdOf(node) ?? ROOT_ID);
    }
  }, [node]);

  const items = useMemo(() => toTreeItems(folders, excludedIds(folders, node)), [folders, node]);

  const targetFolderId = targetId === ROOT_ID ? null : targetId;
  const isSameParent = node ? targetFolderId === parentIdOf(node) : true;

  const handleMove = async (): Promise<void> => {
    if (!node) {
      return;
    }

    try {
      if (node.type === NodeType.File) {
        await moveFile({ fileId: node.id, targetFolderId }).unwrap();
      } else {
        await moveFolder({ folderId: node.id, targetFolderId }).unwrap();
      }

      onOpenChange(false);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Не удалось переместить. Попробуйте ещё раз"));
    }
  };

  return (
    <Modal open={node !== null} onOpenChange={onOpenChange}>
      <ModalContent
        size="sm"
        title="Переместить"
        description={node ? `Куда переместить «${node.name}»` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              loading={isFileMoving || isFolderMoving}
              disabled={isSameParent}
              onClick={() => void handleMove()}
            >
              Переместить
            </Button>
          </>
        }
      >
        {isLoading ? (
          <p className={styles.hint}>Загружаем папки…</p>
        ) : (
          <Tree
            items={items}
            activeId={targetId}
            onSelect={setTargetId}
            aria-label="Папка назначения"
            className={styles.tree}
          />
        )}
      </ModalContent>
    </Modal>
  );
};
