"use client";

import { RequireAuth } from "@features/require-auth";
import { AppShell } from "@widgets/app-shell";
import { FileExplorer } from "@widgets/file-explorer";

export type FilesExplorerViewProps = {
  folderId: string | null;
  /** Параметры возврата из поиска: `?highlight=<id>&q=<запрос>`. */
  highlight?: {
    nodeId: string | null;
    query: string;
  };
};

export const FilesExplorerView = ({ folderId, highlight }: FilesExplorerViewProps) => (
  <RequireAuth>
    <AppShell>
      <FileExplorer
        folderId={folderId}
        highlightNodeId={highlight?.nodeId ?? null}
        highlightQuery={highlight?.query ?? ""}
      />
    </AppShell>
  </RequireAuth>
);
