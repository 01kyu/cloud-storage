"use client";

import { Fragment } from "react";

import { highlightMatch } from "@shared/lib";

import styles from "./file-explorer.module.scss";

export type NodeHighlightProps = {
  /** id объекта, к которому вернулись из поиска (`?highlight=<id>`). */
  highlightNodeId?: string | null;
  /** Запрос (`?q=`), совпадение с которым подсвечивается в имени. */
  highlightQuery?: string;
};

/** id строки листинга: нужен и подсветке, и автоскроллу к найденному объекту. */
export const nodeRowId = (nodeId: string): string => `node-${nodeId}`;

export type HighlightedNameProps = {
  text: string;
  /** Запрос из `?q=`: пустой — имя рендерится как есть. */
  query?: string;
};

/**
 * Имя с подсветкой совпадения: переход из поиска помечает найденный объект
 * (`?highlight=<id>`) и его совпадение с запросом (`?q=`).
 */
export const HighlightedName = ({ text, query = "" }: HighlightedNameProps) => {
  const parts = highlightMatch(text, query);

  if (parts.every((part) => !part.match)) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className={styles.match}>
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
};
