import type { Metadata } from "next";

import { FilesExplorerView } from "@views/files-explorer";

export const metadata: Metadata = {
  title: "Файлы",
};

type FilesPageProps = {
  params: Promise<{ folderId?: string[] }>;
  /** `?highlight=<id>&q=<запрос>` — возврат к результату поиска. */
  searchParams: Promise<{ highlight?: string; q?: string }>;
};

/** Catch-all: `/files/:id/:nested` — тот же экран, папка берётся из первого сегмента. */
const FilesPage = async ({ params, searchParams }: FilesPageProps) => {
  const { folderId } = await params;
  const { highlight, q } = await searchParams;

  return (
    <FilesExplorerView
      folderId={folderId?.[0] ?? null}
      highlight={{ nodeId: highlight ?? null, query: q ?? "" }}
    />
  );
};

export default FilesPage;
