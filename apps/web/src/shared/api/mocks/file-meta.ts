import { FileKind } from "@cs/shared";

/** Расширение из имени файла: `"Отчёт.PDF"` → `"pdf"`. */
export const extensionOf = (name: string): string | null => {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === name.length - 1) {
    return null;
  }

  return name.slice(dotIndex + 1).toLowerCase();
};

const ARCHIVE_EXTENSIONS = new Set(["zip", "rar", "7z", "tar", "gz", "bz2"]);
const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "md",
  "rtf",
  "odt",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  zip: "application/zip",
  txt: "text/plain",
};

/** MIME по расширению — нужен, когда клиент не прислал тип (например, при скачивании). */
export const mimeOf = (name: string): string => {
  const extension = extensionOf(name);

  return (extension ? MIME_BY_EXTENSION[extension] : undefined) ?? "application/octet-stream";
};

/** Браузеры не всегда присылают `type`, а контракт требует `FileKind`. */
export const fileKindOf = (mimeType: string, name: string): FileKind => {
  if (mimeType.startsWith("image/")) {
    return FileKind.Image;
  }

  if (mimeType.startsWith("video/")) {
    return FileKind.Video;
  }

  if (mimeType.startsWith("audio/")) {
    return FileKind.Audio;
  }

  const extension = extensionOf(name) ?? "";

  if (ARCHIVE_EXTENSIONS.has(extension)) {
    return FileKind.Archive;
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return FileKind.Document;
  }

  return FileKind.Other;
};
