import {
  LIMITS,
  SortDirection,
  SortField,
  type ListQuery,
  type ListResponse,
  type Node,
} from "@cs/shared";

const collator = new Intl.Collator("ru", { sensitivity: "base", numeric: true });

const isSortField = (value: string): value is SortField =>
  (Object.values(SortField) as string[]).includes(value);

type ParsedSort = {
  field: SortField;
  direction: SortDirection;
};

/** `sort=name:asc|size:desc|createdAt:asc|updatedAt:desc`; неизвестное значение — дефолт. */
export const parseSort = (sort?: string): ParsedSort => {
  const [rawField, rawDirection] = (sort ?? "").split(":");

  return {
    field: rawField && isSortField(rawField) ? rawField : SortField.Name,
    direction: rawDirection === SortDirection.Desc ? SortDirection.Desc : SortDirection.Asc,
  };
};

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

/** Сортировка листинга: папки всегда выше файлов, внутри группы — по полю и направлению. */
export const sortNodes = (nodes: Node[], sort?: string): Node[] => {
  const { field, direction } = parseSort(sort);
  const factor = direction === SortDirection.Desc ? -1 : 1;

  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }

    const primary = compareValues(a, b, field) * factor;

    return primary !== 0 ? primary : collator.compare(a.name, b.name);
  });
};

/** Курсорная пагинация: курсор — это смещение в строковом виде. */
export const paginate = <T>(items: T[], cursor?: string, limit?: number): ListResponse<T> => {
  const size = Math.min(Math.max(limit ?? LIMITS.pageSize, 1), LIMITS.maxPageSize);
  const offset = Math.max(Number.parseInt(cursor ?? "0", 10) || 0, 0);
  const nextOffset = offset + size;

  return {
    items: items.slice(offset, nextOffset),
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
  };
};

export const listNodes = (nodes: Node[], query: ListQuery): ListResponse<Node> =>
  paginate(sortNodes(nodes, query.sort), query.cursor, query.limit);

/** Параметры листинга из query string: курсор, лимит и сортировка. */
export const readListQuery = (request: Request): ListQuery => {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");

  return {
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: limit ? Number(limit) : undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  };
};
