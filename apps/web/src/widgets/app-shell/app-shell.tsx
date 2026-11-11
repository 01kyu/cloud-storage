"use client";

import type { ReactNode } from "react";

import styles from "./app-shell.module.scss";
import { AppSidebar } from "./app-sidebar";

export type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => (
  <div className={styles.root}>
    <AppSidebar />
    <div className={styles.content}>{children}</div>
  </div>
);
