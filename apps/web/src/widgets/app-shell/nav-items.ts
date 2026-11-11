import { FolderOpen, Link2, Settings, Trash2 } from "lucide-react";

import { ROUTES } from "@shared/config";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof FolderOpen;
};

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.files, label: "Файлы", icon: FolderOpen },
  { href: ROUTES.trash, label: "Корзина", icon: Trash2 },
  { href: ROUTES.shared, label: "Общий доступ", icon: Link2 },
  { href: ROUTES.settings, label: "Настройки", icon: Settings },
];

/** `/files` и `/files/:folderId` оба подсвечивают пункт «Файлы». */
export const isNavItemActive = (href: string, pathname: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);
