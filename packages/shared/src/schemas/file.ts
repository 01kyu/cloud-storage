import { z } from "zod";

import { fileKindSchema, fileStatusSchema } from "../enums/file-kind";
import { NodeType } from "../enums/node-type";

import { idSchema, isoDateTimeSchema, nonNegativeIntSchema } from "./common";
import { folderSchema } from "./folder";

export const fileSchema = z.object({
  id: idSchema,
  type: z.literal(NodeType.File),
  name: z.string().min(1).max(255),
  folderId: idSchema.nullable(),
  mimeType: z.string().min(1),
  extension: z.string().nullable(),
  kind: fileKindSchema,
  size: nonNegativeIntSchema,
  status: fileStatusSchema,
  checksum: z.string().length(64).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type FileItem = z.infer<typeof fileSchema>;

export const nodeSchema = z.discriminatedUnion("type", [folderSchema, fileSchema]);

export type Node = z.infer<typeof nodeSchema>;

export const uploadInitPayloadSchema = z.object({
  name: z.string().min(1).max(255),
  folderId: idSchema.nullable(),
  size: nonNegativeIntSchema,
  mimeType: z.string().min(1),
});

export type UploadInitPayload = z.infer<typeof uploadInitPayloadSchema>;

export const uploadInitResponseSchema = z.object({
  file: fileSchema,
  uploadUrl: z.string().min(1),
  expiresAt: isoDateTimeSchema,
});

export type UploadInitResponse = z.infer<typeof uploadInitResponseSchema>;

export const uploadCompletePayloadSchema = z.object({
  fileId: idSchema,
  checksum: z.string().length(64),
});

export type UploadCompletePayload = z.infer<typeof uploadCompletePayloadSchema>;
