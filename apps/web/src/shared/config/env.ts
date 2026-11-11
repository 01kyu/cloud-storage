import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api/v1"),
  NEXT_PUBLIC_API_MOCKING: z.enum(["on", "off"]).default("on"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
});

export const isMockingEnabled = env.NEXT_PUBLIC_API_MOCKING === "on";
