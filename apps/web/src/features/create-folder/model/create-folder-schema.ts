import { z } from "zod";

/** Ограничения контракта, но с сообщениями для пользователя. */
export const createFolderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Введите название папки")
    .max(255, "Название не длиннее 255 символов"),
});

export type CreateFolderFormValues = z.infer<typeof createFolderFormSchema>;
