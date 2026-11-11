"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@shared/lib";

import styles from "./Tree.module.scss";

export type TreeItem = {
  id: string;
  label: ReactNode;
  /** Без `href` узел рендерится как текст: дерево остаётся переиспользуемым. */
  href?: string;
  icon?: ReactNode;
  children?: TreeItem[];
};

export type TreeProps = {
  items: TreeItem[];
  /** id узла текущей страницы: помечается `aria-selected` и `aria-current`. */
  activeId?: string | null;
  /** По умолчанию раскрыты все узлы с детьми. */
  defaultExpandedIds?: string[];
  /**
   * Выбор узла без `href`: такой узел рендерится кнопкой, и дерево работает
   * пикером, не теряя клавиатурную навигацию.
   */
  onSelect?: (id: string) => void;
  className?: string;
  "aria-label": string;
};

type FlatTreeItem = {
  item: TreeItem;
  depth: number;
  parentId: string | null;
  hasChildren: boolean;
  isExpanded: boolean;
};

const collectExpandableIds = (items: TreeItem[], ids = new Set<string>()): Set<string> => {
  items.forEach((item) => {
    if (item.children?.length) {
      ids.add(item.id);
      collectExpandableIds(item.children, ids);
    }
  });

  return ids;
};

/** Разворачивает видимую часть дерева в плоский список — по нему ходит клавиатура. */
const flatten = (
  items: TreeItem[],
  expandedIds: Set<string> | null,
  parentId: string | null = null,
  depth = 0,
  acc: FlatTreeItem[] = [],
): FlatTreeItem[] => {
  items.forEach((item) => {
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = hasChildren && (expandedIds ? expandedIds.has(item.id) : true);

    acc.push({ item, depth, parentId, hasChildren, isExpanded });

    if (isExpanded && item.children) {
      flatten(item.children, expandedIds, item.id, depth + 1, acc);
    }
  });

  return acc;
};

const labelText = (item: TreeItem): string => (typeof item.label === "string" ? item.label : "");

/**
 * Доступное дерево: `role="tree"` + roving tabindex, стрелки — навигация и
 * разворот, `Home/End` — края списка.
 */
export const Tree = ({
  items,
  activeId,
  defaultExpandedIds,
  onSelect,
  className,
  "aria-label": ariaLabel,
}: TreeProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  /** `null` — режим «раскрыто всё»: так дерево реагирует на данные, загруженные позже. */
  const [expandedIds, setExpandedIds] = useState<Set<string> | null>(() =>
    defaultExpandedIds ? new Set(defaultExpandedIds) : null,
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const flatItems = useMemo(() => flatten(items, expandedIds), [items, expandedIds]);
  const tabbableId = focusedId ?? flatItems[0]?.item.id ?? null;

  useEffect(() => {
    if (!focusedId || !listRef.current) {
      return;
    }

    const element = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-tree-id]"),
    ).find((node) => node.dataset.treeId === focusedId);

    if (element && document.activeElement !== element) {
      element.focus();
    }
  }, [focusedId, flatItems]);

  const toggle = (id: string): void => {
    setExpandedIds((current) => {
      const next = new Set(current ?? collectExpandableIds(items));

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    const id = (event.target as HTMLElement | null)?.dataset.treeId;

    if (!id) {
      return;
    }

    const index = flatItems.findIndex(({ item }) => item.id === id);
    const current = flatItems[index];

    if (!current) {
      return;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setFocusedId(flatItems[Math.min(index + 1, flatItems.length - 1)]?.item.id ?? id);
        break;
      }

      case "ArrowUp": {
        event.preventDefault();
        setFocusedId(flatItems[Math.max(index - 1, 0)]?.item.id ?? id);
        break;
      }

      case "Home": {
        event.preventDefault();
        setFocusedId(flatItems[0]?.item.id ?? id);
        break;
      }

      case "End": {
        event.preventDefault();
        setFocusedId(flatItems[flatItems.length - 1]?.item.id ?? id);
        break;
      }

      case "ArrowRight": {
        event.preventDefault();

        if (!current.hasChildren) {
          break;
        }

        if (current.isExpanded) {
          const childId = current.item.children?.[0]?.id;

          if (childId) {
            setFocusedId(childId);
          }
        } else {
          toggle(current.item.id);
        }

        break;
      }

      case "ArrowLeft": {
        event.preventDefault();

        if (current.hasChildren && current.isExpanded) {
          toggle(current.item.id);
        } else if (current.parentId) {
          setFocusedId(current.parentId);
        }

        break;
      }

      default:
        break;
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={cn(styles.root, className)} aria-label={ariaLabel}>
      <ul ref={listRef} className={styles.list} role="tree" onKeyDown={handleKeyDown}>
        {flatItems.map(({ item, depth, hasChildren, isExpanded }) => {
          const isActive = activeId === item.id;
          const itemLabel = labelText(item);

          const content = (
            <>
              {item.icon ? (
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span className={styles.label}>{item.label}</span>
            </>
          );

          return (
            <li key={item.id} className={styles.item} role="none">
              <div className={styles.row}>
                {hasChildren ? (
                  <button
                    type="button"
                    className={styles.toggle}
                    tabIndex={-1}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Свернуть" : "Развернуть"}${itemLabel ? ` «${itemLabel}»` : ""}`}
                    onClick={() => toggle(item.id)}
                  >
                    <ChevronRight
                      className={cn(styles.chevron, isExpanded && styles.chevronOpen)}
                      size={14}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <span className={styles.toggleSpacer} aria-hidden="true" />
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    role="treeitem"
                    className={cn(styles.link, isActive && styles.linkActive)}
                    data-tree-id={item.id}
                    aria-level={depth + 1}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    aria-selected={isActive}
                    aria-current={isActive ? "page" : undefined}
                    tabIndex={tabbableId === item.id ? 0 : -1}
                    onFocus={() => setFocusedId(item.id)}
                  >
                    {content}
                  </Link>
                ) : onSelect ? (
                  <button
                    type="button"
                    role="treeitem"
                    className={cn(styles.link, styles.button, isActive && styles.linkActive)}
                    data-tree-id={item.id}
                    aria-level={depth + 1}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    aria-selected={isActive}
                    tabIndex={tabbableId === item.id ? 0 : -1}
                    onFocus={() => setFocusedId(item.id)}
                    onClick={() => onSelect(item.id)}
                  >
                    {content}
                  </button>
                ) : (
                  <span
                    role="treeitem"
                    className={cn(styles.link, isActive && styles.linkActive)}
                    data-tree-id={item.id}
                    aria-level={depth + 1}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    aria-selected={isActive}
                    tabIndex={tabbableId === item.id ? 0 : -1}
                    onFocus={() => setFocusedId(item.id)}
                  >
                    {content}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
