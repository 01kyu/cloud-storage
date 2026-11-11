import { NodeType, SortDirection, SortField, type Node } from "@cs/shared";

const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });

const compareValues = (a: Node, b: Node, field: SortField): number => {
  switch (field) {
    case SortField.Size:
      return a.size - b.size;
    case SortField.CreatedAt:
      return a.createdAt.localeCompare(b.createdAt);
    case SortField.UpdatedAt:
      return a.updatedAt.localeCompare(b.updatedAt);
    default:
      return collator.compare(a.name, b.name);
  }
};

/** Папки всегда выше файлов, внутри группы — по выбранному полю, при равенстве — по имени. */
export const sortNodes = (
  nodes: Node[],
  field: SortField = SortField.Name,
  direction: SortDirection = SortDirection.Asc,
): Node[] => {
  const factor = direction === SortDirection.Desc ? -1 : 1;

  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === NodeType.Folder ? -1 : 1;
    }

    const primary = compareValues(a, b, field) * factor;

    return primary !== 0 ? primary : collator.compare(a.name, b.name);
  });
};
