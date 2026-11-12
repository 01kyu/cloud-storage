import { z } from "zod";

import { LIMITS } from "../constants/limits";
import { nodeTypeSchema } from "../enums/node-type";
import { sharePermissionSchema } from "../enums/share-permission";

import { idSchema, isoDateTimeSchema, nonNegativeIntSchema } from "./common";

export const shareSchema = z.object({
  id: idSchema,
  nodeId: idSchema,
  nodeType: nodeTypeSchema,
  nodeName: z.string().min(1),
  token: z.string().min(LIMITS.shareTokenMinLength),
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
  password: z
    .string()
    .min(LIMITS.sharePasswordMinLength)
    .max(LIMITS.sharePasswordMaxLength)
    .optional(),
  expiresAt: isoDateTimeSchema.optional(),
});

export type CreateSharePayload = z.infer<typeof createSharePayloadSchema>;

/**
 * Ответ публичного эндпоинта: гостю не нужны `id`, `nodeId` и токен списка,
 * зато нужен `permission` — от него зависит, показывать ли кнопку скачивания.
 */
export const publicShareSchema = z.object({
  token: z.string().min(LIMITS.shareTokenMinLength),
  nodeType: nodeTypeSchema,
  nodeName: z.string().min(1),
  mimeType: z.string().min(1).nullable(),
  size: nonNegativeIntSchema,
  permission: sharePermissionSchema,
  hasPassword: z.boolean(),
  expiresAt: isoDateTimeSchema.nullable(),
});

export type PublicShare = z.infer<typeof publicShareSchema>;
