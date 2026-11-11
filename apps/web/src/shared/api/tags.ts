/** Теги по доменам: инвалидация точечная, мутация обновляет только затронутые списки. */
export const TAG_TYPES = ["User", "Folder", "File", "Trash", "Share"] as const;

export type TagType = (typeof TAG_TYPES)[number];
