import { z } from "zod";

import { userSchema } from "./user";

export const loginPayloadSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const registerPayloadSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
});

export type RegisterPayload = z.infer<typeof registerPayloadSchema>;

export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string().min(1),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
