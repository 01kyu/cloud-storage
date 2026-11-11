"use client";

import { useMemo } from "react";
import { Folder as FolderIcon } from "lucide-react";

import { ROUTES } from "@shared/config";
import { Tree, type TreeItem } from "@shared/ui";

import type { FolderTreeNode } from "../lib/build-tree";

const toTreeItems = (nodes: FolderTreeNode[]): TreeItem[] =>
  nodes.map((node) => ({
    id: node.id,
    label: node.name,
    href: ROUTES.folder(node.id),
    icon: <FolderIcon size={16} />,
    children: toTreeItems(node.children),
  }));

export type FolderTreeProps = {
  items: FolderTreeNode[];
  activeId?: string | null;
  className?: string;
};

export const FolderTree = ({ items, activeId = null, className }: FolderTreeProps) => {
  const treeItems = useMemo(() => toTreeItems(items), [items]);

  return (
    <Tree items={treeItems} activeId={activeId} className={className} aria-label="Дерево папок" />
  );
};
