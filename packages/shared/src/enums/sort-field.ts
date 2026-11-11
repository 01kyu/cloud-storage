import { z } from "zod";

export const SortField = {
  Name: "name",
  Size: "size",
  CreatedAt: "createdAt",
  UpdatedAt: "updatedAt",
} as const;

export type SortField = (typeof SortField)[keyof typeof SortField];

export const sortFieldSchema = z.enum([
  SortField.Name,
  SortField.Size,
  SortField.CreatedAt,
  SortField.UpdatedAt,
]);

export const SortDirection = {
  Asc: "asc",
  Desc: "desc",
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export const sortDirectionSchema = z.enum([SortDirection.Asc, SortDirection.Desc]);
