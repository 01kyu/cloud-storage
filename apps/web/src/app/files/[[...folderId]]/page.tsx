import type { Metadata } from "next";

import { FilesExplorerView } from "@views/files-explorer";

export const metadata: Metadata = {
  title: "Файлы",
};

type FilesPageProps = {
  params: Promise<{ folderId?: string[] }>;
};

/** Catch-all: `/files/:id/:nested` — тот же экран, папка берётся из первого сегмента. */
const FilesPage = async ({ params }: FilesPageProps) => {
  const { folderId } = await params;

  return <FilesExplorerView folderId={folderId?.[0] ?? null} />;
};

export default FilesPage;
