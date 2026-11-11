"use client";

import { useState, type DragEvent } from "react";

import { NodeType, type Node } from "@cs/shared";
import { useMoveFileMutation } from "@entities/file";
import { useMoveFolderMutation } from "@entities/folder";

/** MIME перетаскиваемого узла: по нему отличаем узел хранилища от файла из ОС. */
export const NODE_DRAG_MIME = "application/x-cs-node";

type NodeDragPayload = { id: string; type: NodeType };

const parsePayload = (raw: string): NodeDragPayload | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const { id, type } = parsed as Partial<NodeDragPayload>;

    if (typeof id !== "string" || (type !== NodeType.File && type !== NodeType.Folder)) {
      return null;
    }

    return { id, type };
  } catch {
    return null;
  }
};

export type NodeDragProps = {
  draggable: true;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
};

export type NodeDropProps = {
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
};

export type NodeDndState = {
  dragProps: NodeDragProps;
  dropProps: NodeDropProps;
  /** Курсор над целью переноса: подсветка строки. */
  isOver: boolean;
};

const dragPropsOf = (node: Node): NodeDragProps => ({
  draggable: true,
  onDragStart: (event) => {
    const payload: NodeDragPayload = { id: node.id, type: node.type };

    event.dataTransfer.setData(NODE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "move";
  },
});

/** Цель drop — только папка; ошибку переноса не показываем, листинг остаётся прежним. */
export const useNodeDnd = (node: Node): NodeDndState => {
  const [moveFile] = useMoveFileMutation();
  const [moveFolder] = useMoveFolderMutation();
  const [isOver, setIsOver] = useState(false);

  const dragProps = dragPropsOf(node);

  const folderDropProps: NodeDropProps = {
    onDragOver: (event) => {
      if (!event.dataTransfer.types.includes(NODE_DRAG_MIME)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setIsOver(true);
    },
    onDragLeave: () => setIsOver(false),
    onDrop: (event) => {
      const payload = parsePayload(event.dataTransfer.getData(NODE_DRAG_MIME));

      setIsOver(false);

      if (!payload || payload.id === node.id) {
        return;
      }

      event.preventDefault();

      if (payload.type === NodeType.File) {
        void moveFile({ fileId: payload.id, targetFolderId: node.id })
          .unwrap()
          .catch(() => undefined);
      } else {
        void moveFolder({ folderId: payload.id, targetFolderId: node.id })
          .unwrap()
          .catch(() => undefined);
      }
    },
  };

  /** Файл — только источник переноса: обработчики drop нужны лишь папке. */
  const dropProps: NodeDropProps = node.type === NodeType.Folder ? folderDropProps : {};

  return { dragProps, dropProps, isOver };
};
