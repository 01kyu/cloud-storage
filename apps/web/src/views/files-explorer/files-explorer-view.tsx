"use client";

import { RequireAuth } from "@features/require-auth";
import { AppShell } from "@widgets/app-shell";
import { FileExplorer } from "@widgets/file-explorer";

export type FilesExplorerViewProps = {
  folderId: string | null;
};

export const FilesExplorerView = ({ folderId }: FilesExplorerViewProps) => (
  <RequireAuth>
    <AppShell>
      <FileExplorer folderId={folderId} />
    </AppShell>
  </RequireAuth>
);
