import { z } from "zod";

import { LIMITS, SharePermission } from "@cs/shared";

/** Срок выбирается пресетами: произвольная дата пользователю здесь не нужна. */
export const SHARE_EXPIRY = {
  never: "never",
  day: "1d",
  week: "7d",
  month: "30d",
} as const;

export type ShareExpiry = (typeof SHARE_EXPIRY)[keyof typeof SHARE_EXPIRY];

const EXPIRY_VALUES = [
  SHARE_EXPIRY.never,
  SHARE_EXPIRY.day,
  SHARE_EXPIRY.week,
  SHARE_EXPIRY.month,
] as const;

/**
 * Пароль проверяется только при включённой защите: иначе пустое поле формы
 * блокировало бы создание обычной ссылки.
 */
export const createShareFormSchema = z
  .object({
    permission: z.enum([SharePermission.Read, SharePermission.Download]),
    expiresIn: z.enum(EXPIRY_VALUES),
    protectWithPassword: z.boolean(),
    password: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.protectWithPassword) {
      return;
    }

    const password = values.password.trim();

    if (password.length < LIMITS.sharePasswordMinLength) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: `Пароль от ${LIMITS.sharePasswordMinLength} символов`,
      });
    }

    if (password.length > LIMITS.sharePasswordMaxLength) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: `Пароль не длиннее ${LIMITS.sharePasswordMaxLength} символов`,
      });
    }
  });

export type CreateShareFormValues = z.infer<typeof createShareFormSchema>;

export const DEFAULT_CREATE_SHARE_VALUES: CreateShareFormValues = {
  permission: SharePermission.Read,
  expiresIn: SHARE_EXPIRY.never,
  protectWithPassword: false,
  password: "",
};
