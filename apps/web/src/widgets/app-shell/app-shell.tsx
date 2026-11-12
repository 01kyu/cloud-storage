"use client";

import { useCallback, useState, type ReactNode } from "react";

import { SearchPalette, useSearchHotkey } from "@features/search-files";

import styles from "./app-shell.module.scss";
import { AppSidebar } from "./app-sidebar";

export type AppShellProps = {
  children: ReactNode;
};

/**
 * Палитра живёт на уровне оболочки: её открывают из сайдбара и хоткеем,
 * а сама она перекрывает любую страницу приложения.
 */
export const AppShell = ({ children }: AppShellProps) => {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useSearchHotkey(openSearch);

  return (
    <div className={styles.root}>
      <AppSidebar onSearchOpen={openSearch} />
      <div className={styles.content}>{children}</div>
      <SearchPalette open={isSearchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};
