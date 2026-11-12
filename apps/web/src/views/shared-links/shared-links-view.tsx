"use client";

import { RequireAuth } from "@features/require-auth";
import { AppShell } from "@widgets/app-shell";
import { SharesExplorer } from "@widgets/shares-explorer";

export const SharedLinksView = () => (
  <RequireAuth>
    <AppShell>
      <SharesExplorer />
    </AppShell>
  </RequireAuth>
);
