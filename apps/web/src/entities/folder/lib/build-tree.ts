import type { Folder } from "@cs/shared";

export type FolderTreeNode = {
  id: string;
  name: string;
  children: FolderTreeNode[];
};

const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });

const sortRecursively = (nodes: FolderTreeNode[]): void => {
  nodes.sort((a, b) => collator.compare(a.name, b.name));
  nodes.forEach((node) => sortRecursively(node.children));
};

/** Папка с неизвестным родителем становится корневой — данные не теряются. */
export const buildFolderTree = (folders: Folder[]): FolderTreeNode[] => {
  const nodes = new Map<string, FolderTreeNode>(
    folders.map((folder) => [folder.id, { id: folder.id, name: folder.name, children: [] }]),
  );
  const roots: FolderTreeNode[] = [];

  folders.forEach((folder) => {
    const node = nodes.get(folder.id);

    if (!node) {
      return;
    }

    const parent = folder.parentId ? nodes.get(folder.parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortRecursively(roots);

  return roots;
};
