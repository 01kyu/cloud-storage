import { z } from "zod";

import { NodeType } from "../enums/node-type";

import { idSchema, isoDateTimeSchema, nonNegativeIntSchema } from "./common";

export const folderSchema = z.object({
  id: idSchema,
  type: z.literal(NodeType.Folder),
  name: z.string().min(1).max(255),
  parentId: idSchema.nullable(),
  path: z.string(),
  depth: nonNegativeIntSchema,
  childCount: nonNegativeIntSchema,
  size: nonNegativeIntSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type Folder = z.infer<typeof folderSchema>;

export const createFolderPayloadSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: idSchema.nullable(),
});

export type CreateFolderPayload = z.infer<typeof createFolderPayloadSchema>;

export const renameNodePayloadSchema = z.object({
  name: z.string().min(1).max(255),
});

export type RenameNodePayload = z.infer<typeof renameNodePayloadSchema>;

export const moveNodePayloadSchema = z.object({
  targetFolderId: idSchema.nullable(),
});

export type MoveNodePayload = z.infer<typeof moveNodePayloadSchema>;
