"use client";

import { Button } from "../Button";

import styles from "./LoadMore.module.scss";

export type LoadMoreProps = {
  /** `false` — дальше грузить нечего или достигнут потолок: кнопка исчезает. */
  hasMore: boolean;
  /** Сколько элементов уже загружено: обновление объявляется скринридеру. */
  loadedCount: number;
  loading?: boolean;
  onLoadMore: () => void;
};

/**
 * Догрузка листинга: одна кнопка и `aria-live`-счётчик.
 * Что ещё есть — решает сервер (`nextCursor`), компонент не угадывает.
 */
export const LoadMore = ({ hasMore, loadedCount, loading = false, onLoadMore }: LoadMoreProps) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div className={styles.root}>
      <p className={styles.counter} role="status">
        {`Показано ${loadedCount}`}
      </p>
      <Button variant="secondary" size="sm" loading={loading} onClick={onLoadMore}>
        Показать ещё
      </Button>
    </div>
  );
};
