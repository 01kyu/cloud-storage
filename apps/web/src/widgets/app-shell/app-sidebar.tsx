"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive, Moon, Sun } from "lucide-react";

import { buildFolderTree, FolderTree, useGetFolderTreeQuery } from "@entities/folder";
import { QuotaCard, useCurrentUser } from "@entities/user";
import { LogoutButton } from "@features/logout";
import { SearchTrigger } from "@features/search-files";
import { ROUTES } from "@shared/config";
import { cn, useTheme } from "@shared/lib";
import { Avatar, IconButton, Separator, Skeleton } from "@shared/ui";

import styles from "./app-shell.module.scss";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/** Текущая папка из URL: `/files/:id` → `id`, иначе `null`. */
const getActiveFolderId = (pathname: string): string | null => {
  if (!pathname.startsWith(`${ROUTES.files}/`)) {
    return null;
  }

  const [folderId] = pathname.slice(ROUTES.files.length + 1).split("/");

  return folderId ?? null;
};

export type AppSidebarProps = {
  onSearchOpen: () => void;
};

export const AppSidebar = ({ onSearchOpen }: AppSidebarProps) => {
  const pathname = usePathname() ?? ROUTES.files;
  const activeFolderId = getActiveFolderId(pathname);
  const { data: folders, isLoading: isTreeLoading } = useGetFolderTreeQuery();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  const tree = useMemo(() => (folders ? buildFolderTree(folders) : []), [folders]);
  const isDark = theme === "dark";
  const isUserPending = isUserLoading || !user;

  return (
    <aside className={styles.sidebar}>
      <Link href={ROUTES.files} className={styles.brand}>
        <HardDrive size={20} aria-hidden="true" className={styles.brandIcon} />
        <span>Cloud Storage</span>
      </Link>

      <SearchTrigger onClick={onSearchOpen} />

      <nav aria-label="Основная навигация">
        <ul className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.href, pathname);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(styles.navLink, isActive && styles.navLinkActive)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      <section className={styles.treeSection} aria-label="Папки">
        <h2 className={styles.sectionTitle}>Папки</h2>
        <div className={styles.treeScroll}>
          {isTreeLoading ? (
            <div className={styles.treeSkeleton}>
              <Skeleton height={16} />
              <Skeleton height={16} width="80%" />
              <Skeleton height={16} width="60%" />
            </div>
          ) : (
            <FolderTree items={tree} activeId={activeFolderId} />
          )}
        </div>
      </section>

      <div className={styles.footer}>
        <QuotaCard
          used={user?.storageUsed ?? 0}
          quota={user?.storageQuota ?? 0}
          loading={isUserPending}
        />
        <div className={styles.user}>
          {isUserPending ? (
            <>
              <Skeleton circle width={32} height={32} />
              <div className={styles.userText}>
                <Skeleton height={12} width="70%" />
                <Skeleton height={10} width="90%" />
              </div>
            </>
          ) : (
            <>
              <Avatar alt={user.name} fallback={getInitials(user.name)} size="sm" />
              <div className={styles.userText}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </>
          )}
          <IconButton
            label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
            variant="ghost"
            size="sm"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </IconButton>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
};
