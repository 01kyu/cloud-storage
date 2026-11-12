import {
  NodeType,
  type FileKind,
  type ListResponse,
  type Node,
  type SearchQuery,
} from "@cs/shared";

import { getDb } from "./db";
import { paginate, sortNodes } from "./query";

const normalize = (value: string): string => value.toLocaleLowerCase("ru");

const isKind = (node: Node, kind: FileKind): boolean =>
  node.type === NodeType.File && node.kind === kind;

/**
 * Подстрочный поиск по имени без учёта регистра: «рез» находит «Резюме.pdf».
 * Корзина в поиск не попадает — удалённые узлы лежат отдельно от активной ФС.
 */
export const searchNodes = (query: SearchQuery): Node[] => {
  const needle = normalize(query.q);
  const nodes: Node[] = [...getDb().folders, ...getDb().files];

  const matched = nodes.filter((node) => {
    if (query.type && node.type !== query.type) {
      return false;
    }

    if (query.kind && !isKind(node, query.kind)) {
      return false;
    }

    return normalize(node.name).includes(needle);
  });

  return sortNodes(matched, query.sort);
};

/** Пагинация поиска общая с листингом: тот же курсор-смещение. */
export const searchPage = (query: SearchQuery): ListResponse<Node> =>
  paginate(searchNodes(query), query.cursor, query.limit);
