"use client";

import { Search } from "lucide-react";

import { Button } from "@shared/ui";

import styles from "./search-trigger.module.scss";

export type SearchTriggerProps = {
  onClick: () => void;
};

/** Кнопка в сайдбаре: дублирует хоткей, чтобы поиск был заметен. */
export const SearchTrigger = ({ onClick }: SearchTriggerProps) => (
  <Button
    variant="secondary"
    size="sm"
    fullWidth
    className={styles.root}
    iconLeft={<Search size={14} aria-hidden="true" />}
    iconRight={
      <kbd className={styles.hotkey} aria-hidden="true">
        Ctrl K
      </kbd>
    }
    aria-label="Поиск"
    onClick={onClick}
  >
    Поиск
  </Button>
);
