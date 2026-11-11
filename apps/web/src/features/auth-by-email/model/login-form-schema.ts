import { z } from "zod";

import { LIMITS } from "@cs/shared";

/** Ограничения контракта, но с сообщениями для пользователя. */
export const loginFormSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z
    .string()
    .min(LIMITS.minPasswordLength, `Пароль не короче ${LIMITS.minPasswordLength} символов`)
    .max(72, "Пароль не длиннее 72 символов"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
