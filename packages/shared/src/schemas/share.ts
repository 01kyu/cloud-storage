import { z } from "zod";

import { nodeTypeSchema } from "../enums/node-type";
import { sharePermissionSchema } from "../enums/share-permission";

import { idSchema, isoDateTimeSchema, nonNegativeIntSchema } from "./common";

export const shareSchema = z.object({
  id: idSchema,
  nodeId: idSchema,
  nodeType: nodeTypeSchema,
  nodeName: z.string().min(1),
  token: z.string().min(8),
  permission: sharePermissionSchema,
  hasPassword: z.boolean(),
  expiresAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export type Share = z.infer<typeof shareSchema>;

export const createSharePayloadSchema = z.object({
  nodeId: idSchema,
  nodeType: nodeTypeSchema,
  permission: sharePermissionSchema,
  password: z.string().min(4).max(72).optional(),
  expiresAt: isoDateTimeSchema.optional(),
});

export type CreateSharePayload = z.infer<typeof createSharePayloadSchema>;

export const publicShareSchema = z.object({
  token: z.string().min(8),
  nodeType: nodeTypeSchema,
  nodeName: z.string().min(1),
  mimeType: z.string().min(1).nullable(),
  size: nonNegativeIntSchema,
  hasPassword: z.boolean(),
  expiresAt: isoDateTimeSchema.nullable(),
});

export type PublicShare = z.infer<typeof publicShareSchema>;
