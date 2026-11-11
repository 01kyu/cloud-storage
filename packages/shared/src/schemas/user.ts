import { z } from "zod";

import { idSchema, isoDateTimeSchema, nonNegativeIntSchema } from "./common";

export const UserRole = {
  User: "user",
  Admin: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const userRoleSchema = z.enum([UserRole.User, UserRole.Admin]);

export const userSchema = z.object({
  id: idSchema,
  email: z.email(),
  name: z.string().min(1).max(80),
  avatarUrl: z.url().nullable(),
  role: userRoleSchema,
  storageQuota: nonNegativeIntSchema,
  storageUsed: nonNegativeIntSchema,
  createdAt: isoDateTimeSchema,
});

export type User = z.infer<typeof userSchema>;
