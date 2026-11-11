import { z } from "zod";

export const ApiErrorCode = {
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  ValidationFailed: "VALIDATION_FAILED",
  QuotaExceeded: "QUOTA_EXCEEDED",
  PayloadTooLarge: "PAYLOAD_TOO_LARGE",
  ShareExpired: "SHARE_EXPIRED",
  Internal: "INTERNAL",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export const apiErrorCodeSchema = z.enum([
  ApiErrorCode.Unauthorized,
  ApiErrorCode.Forbidden,
  ApiErrorCode.NotFound,
  ApiErrorCode.Conflict,
  ApiErrorCode.ValidationFailed,
  ApiErrorCode.QuotaExceeded,
  ApiErrorCode.PayloadTooLarge,
  ApiErrorCode.ShareExpired,
  ApiErrorCode.Internal,
]);

export const apiErrorSchema = z.object({
  statusCode: z.number().int().min(400).max(599),
  code: apiErrorCodeSchema,
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
