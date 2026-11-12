import { FileKind, NodeType } from "@cs/shared";

/**
 * Один контрол вместо двух: значение сразу превращается либо в `type`
 * (папки/файлы), либо в `kind` (вид файла).
 */
export const SearchFilter = {
  All: "all",
  Folder: NodeType.Folder,
  File: NodeType.File,
  Image: FileKind.Image,
  Video: FileKind.Video,
  Audio: FileKind.Audio,
  Document: FileKind.Document,
  Archive: FileKind.Archive,
} as const;

export type SearchFilter = (typeof SearchFilter)[keyof typeof SearchFilter];

export type SearchFilterParams = {
  type?: NodeType;
  kind?: FileKind;
};

export const SEARCH_FILTER_LABELS: Record<SearchFilter, string> = {
  [SearchFilter.All]: "Все",
  [SearchFilter.Folder]: "Папки",
  [SearchFilter.File]: "Файлы",
  [SearchFilter.Image]: "Изображения",
  [SearchFilter.Video]: "Видео",
  [SearchFilter.Audio]: "Аудио",
  [SearchFilter.Document]: "Документы",
  [SearchFilter.Archive]: "Архивы",
};

/** Порядок опций в меню — порядок объявления меток. */
export const SEARCH_FILTERS = Object.keys(SEARCH_FILTER_LABELS) as SearchFilter[];

export const searchFilterLabel = (filter: SearchFilter): string => SEARCH_FILTER_LABELS[filter];

export const toSearchFilterParams = (filter: SearchFilter): SearchFilterParams => {
  switch (filter) {
    case SearchFilter.All:
      return {};
    case SearchFilter.Folder:
      return { type: NodeType.Folder };
    case SearchFilter.File:
      return { type: NodeType.File };
    default:
      return { kind: filter };
  }
};
