import { FileKind, type FileItem } from "@cs/shared";

const KIND_LABELS: Record<FileKind, string> = {
  [FileKind.Image]: "Изображение",
  [FileKind.Video]: "Видео",
  [FileKind.Audio]: "Аудио",
  [FileKind.Document]: "Документ",
  [FileKind.Archive]: "Архив",
  [FileKind.Other]: "Файл",
};

export const getFileKindLabel = (kind: FileKind): string => KIND_LABELS[kind];

/** Расширение из имени файла: `"Отчёт.PDF"` → `"pdf"`. */
export const getFileExtension = (name: string): string | null => {
  const dotIndex = name.lastIndexOf(".");

  return dotIndex > 0 && dotIndex < name.length - 1 ? name.slice(dotIndex + 1).toLowerCase() : null;
};

/** Подпись файла для листинга: `"PDF · Документ"`. */
export const describeFile = (file: FileItem): string => {
  const kind = getFileKindLabel(file.kind);
  const extension = getFileExtension(file.name);

  return extension ? `${extension.toUpperCase()} · ${kind}` : kind;
};
