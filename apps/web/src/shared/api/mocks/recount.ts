import { NodeType, type FileItem, type Folder, type TrashItem } from "@cs/shared";

/** `childCount` — прямые дети, `size` — всё поддерево; пересчитывается после каждой мутации. */
export const recountFolders = (folders: Folder[], files: FileItem[]): Folder[] => {
  const counts = new Map<string | null, number>();
  const sizes = new Map<string, number>();
  const parents = new Map(folders.map((folder) => [folder.id, folder.parentId]));

  const bump = (parentId: string | null): void => {
    counts.set(parentId, (counts.get(parentId) ?? 0) + 1);
  };

  folders.forEach((folder) => bump(folder.parentId));

  files.forEach((file) => {
    bump(file.folderId);

    const visited = new Set<string>();
    let currentId = file.folderId;

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      sizes.set(currentId, (sizes.get(currentId) ?? 0) + file.size);
      currentId = parents.get(currentId) ?? null;
    }
  });

  return folders.map((folder) => ({
    ...folder,
    childCount: counts.get(folder.id) ?? 0,
    size: sizes.get(folder.id) ?? 0,
  }));
};

/** Активные файлы плюс корзина: удаление квоту не освобождает. */
export const storageUsed = (files: FileItem[], trash: TrashItem[] = []): number => {
  const trashedFiles = trash.filter(
    (item): item is FileItem & { deletedAt: string } => item.type === NodeType.File,
  );

  return [...files, ...trashedFiles].reduce((total, file) => total + file.size, 0);
};
