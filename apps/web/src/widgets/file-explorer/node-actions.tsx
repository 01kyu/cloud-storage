"use client";

import { useState, type ReactNode } from "react";
import { Download, FolderInput, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";

import { NodeType, type Node } from "@cs/shared";
import { ShareNodeDialog } from "@features/create-share-link";
import { DeleteNodeDialog } from "@features/delete-node";
import { useDownloadFile } from "@features/download-file";
import { MoveNodeDialog } from "@features/move-node";
import { RenameNodeDialog } from "@features/rename-node";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from "@shared/ui";

import styles from "./file-explorer.module.scss";

type NodeAction = "rename" | "move" | "share" | "delete";

type ActionsListProps = {
  isFile: boolean;
  onAction: (action: NodeAction) => void;
  onDownload: () => void;
};

const ContextActions = ({ isFile, onAction, onDownload }: ActionsListProps) => (
  <>
    {isFile ? (
      <ContextMenuItem onSelect={onDownload}>
        <Download size={14} aria-hidden="true" />
        Скачать
      </ContextMenuItem>
    ) : null}
    <ContextMenuItem onSelect={() => onAction("rename")}>
      <Pencil size={14} aria-hidden="true" />
      Переименовать
    </ContextMenuItem>
    <ContextMenuItem onSelect={() => onAction("move")}>
      <FolderInput size={14} aria-hidden="true" />
      Переместить
    </ContextMenuItem>
    <ContextMenuItem onSelect={() => onAction("share")}>
      <Share2 size={14} aria-hidden="true" />
      Поделиться
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem tone="danger" onSelect={() => onAction("delete")}>
      <Trash2 size={14} aria-hidden="true" />
      Удалить
    </ContextMenuItem>
  </>
);

/** То же меню для кнопки «⋮»: контекстное меню недоступно с клавиатуры. */
const DropdownActions = ({ isFile, onAction, onDownload }: ActionsListProps) => (
  <>
    {isFile ? (
      <DropdownMenuItem onSelect={onDownload}>
        <Download size={14} aria-hidden="true" />
        Скачать
      </DropdownMenuItem>
    ) : null}
    <DropdownMenuItem onSelect={() => onAction("rename")}>
      <Pencil size={14} aria-hidden="true" />
      Переименовать
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => onAction("move")}>
      <FolderInput size={14} aria-hidden="true" />
      Переместить
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => onAction("share")}>
      <Share2 size={14} aria-hidden="true" />
      Поделиться
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem tone="danger" onSelect={() => onAction("delete")}>
      <Trash2 size={14} aria-hidden="true" />
      Удалить
    </DropdownMenuItem>
  </>
);

export type NodeActionsProps = {
  node: Node;
  children: ReactNode;
};

/**
 * Одно меню на контекстный клик и «⋮»; диалоги действий живут в фичах,
 * ошибки мутаций показываются тостами.
 */
export const NodeActions = ({ node, children }: NodeActionsProps) => {
  const [action, setAction] = useState<NodeAction | null>(null);
  const { download } = useDownloadFile();
  const isFile = node.type === NodeType.File;

  const handleDownload = (): void => {
    if (node.type === NodeType.File) {
      void download(node);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextActions isFile={isFile} onAction={setAction} onDownload={handleDownload} />
        </ContextMenuContent>
      </ContextMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label={`Действия: ${node.name}`} size="sm" className={styles.actionsButton}>
            <MoreHorizontal size={16} aria-hidden="true" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownActions isFile={isFile} onAction={setAction} onDownload={handleDownload} />
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameNodeDialog
        node={action === "rename" ? node : null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
          }
        }}
      />
      <MoveNodeDialog
        node={action === "move" ? node : null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
          }
        }}
      />
      <ShareNodeDialog
        node={action === "share" ? node : null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
          }
        }}
      />
      <DeleteNodeDialog
        node={action === "delete" ? node : null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
          }
        }}
      />
    </>
  );
};
