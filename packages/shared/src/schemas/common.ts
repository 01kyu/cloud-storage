import { z } from "zod";

export const idSchema = z.uuid();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const nonNegativeIntSchema = z.number().int().nonnegative();

export const listQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export type ListResponse<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export const createListResponseSchema = <TItem extends z.ZodType>(item: TItem) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

export const breadcrumbSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
});

export type Breadcrumb = z.infer<typeof breadcrumbSchema>;
