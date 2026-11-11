import { z } from "zod";

import { isoDateTimeSchema } from "./common";
import { fileSchema } from "./file";
import { folderSchema } from "./folder";

export const trashItemSchema = z.discriminatedUnion("type", [
  folderSchema.extend({ deletedAt: isoDateTimeSchema }),
  fileSchema.extend({ deletedAt: isoDateTimeSchema }),
]);

export type TrashItem = z.infer<typeof trashItemSchema>;

export const purgeTrashPayloadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type PurgeTrashPayload = z.infer<typeof purgeTrashPayloadSchema>;
