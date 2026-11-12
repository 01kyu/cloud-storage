"use client";

import { RequireAuth } from "@features/require-auth";
import { AppShell } from "@widgets/app-shell";
import { TrashExplorer } from "@widgets/trash-explorer";

export const TrashView = () => (
  <RequireAuth>
    <AppShell>
      <TrashExplorer />
    </AppShell>
  </RequireAuth>
);
