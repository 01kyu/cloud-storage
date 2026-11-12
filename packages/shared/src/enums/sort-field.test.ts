import { describe, expect, it } from "vitest";

import { SortDirection, SortField, sortDirectionSchema, sortFieldSchema } from "./sort-field";

/**
 * Сортировка — параметр API (`?sort=size:desc`), поэтому значения енумов
 * попадают в query string: менять их можно только вместе с бэкендом.
 */
describe("SortField", () => {
  it("перечисляет поля, по которым сортирует листинг", () => {
    expect(Object.values(SortField)).toEqual(["name", "size", "createdAt", "updatedAt"]);
  });

  it("схема пропускает каждое известное поле", () => {
    Object.values(SortField).forEach((field) => {
      expect(sortFieldSchema.parse(field)).toBe(field);
    });
  });

  it("схема отклоняет неизвестное поле и пустое значение", () => {
    expect(sortFieldSchema.safeParse("deletedAt").success).toBe(false);
    expect(sortFieldSchema.safeParse("").success).toBe(false);
    expect(sortFieldSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("SortDirection", () => {
  it("знает только asc и desc", () => {
    expect(Object.values(SortDirection)).toEqual(["asc", "desc"]);
  });

  it("схема пропускает оба направления и отклоняет остальное", () => {
    expect(sortDirectionSchema.parse(SortDirection.Asc)).toBe("asc");
    expect(sortDirectionSchema.parse(SortDirection.Desc)).toBe("desc");
    expect(sortDirectionSchema.safeParse("up").success).toBe(false);
    expect(sortDirectionSchema.safeParse("ASC").success).toBe(false);
  });
});
