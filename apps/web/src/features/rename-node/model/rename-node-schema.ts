import { z } from "zod";

/** Ограничения контракта, но с сообщениями для формы. */
export const renameNodeFormSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(255, "Имя не длиннее 255 символов"),
});

export type RenameNodeFormValues = z.infer<typeof renameNodeFormSchema>;
