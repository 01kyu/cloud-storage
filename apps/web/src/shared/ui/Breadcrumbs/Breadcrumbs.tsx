"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@shared/lib";

import styles from "./Breadcrumbs.module.scss";

export type BreadcrumbItem = {
  id: string;
  label: string;
  href: string;
};

export type BreadcrumbsProps = {
  /** Путь от корня к текущей папке: последний элемент — текущая страница. */
  items: BreadcrumbItem[];
  className?: string;
  "aria-label"?: string;
};

/** Разделители скрыты от скринридеров, текущая крошка помечена `aria-current="page"`. */
export const Breadcrumbs = ({
  items,
  className,
  "aria-label": ariaLabel = "Хлебные крошки",
}: BreadcrumbsProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={cn(styles.root, className)} aria-label={ariaLabel}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={item.id} className={styles.item}>
              {index > 0 ? (
                <ChevronRight className={styles.icon} size={14} aria-hidden="true" />
              ) : null}
              <Link
                href={item.href}
                className={styles.link}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
