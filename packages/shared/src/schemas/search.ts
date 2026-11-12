import { z } from "zod";

import { LIMITS } from "../constants/limits";
import { fileKindSchema } from "../enums/file-kind";
import { nodeTypeSchema } from "../enums/node-type";

import { createListResponseSchema, listQuerySchema } from "./common";
import { nodeSchema } from "./file";

/**
 * Поиск идёт по имени среди активных узлов: `q` — подстрока без учёта регистра.
 * `type` и `kind` взаимоисключающи по смыслу (у папки нет `kind`), но контракт
 * не запрещает оба сразу — хендлер применит фильтры последовательно.
 */
export const searchQuerySchema = listQuerySchema.extend({
  q: z.string().trim().min(LIMITS.searchQueryMinLength).max(LIMITS.searchQueryMaxLength),
  type: nodeTypeSchema.optional(),
  kind: fileKindSchema.optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** Результат — обычный узел ФС: по нему строится навигация к папке или файлу. */
export const searchResponseSchema = createListResponseSchema(nodeSchema);

export type SearchResponse = z.infer<typeof searchResponseSchema>;
