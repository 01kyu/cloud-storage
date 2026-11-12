"use client";

import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";

import type { TrashItem } from "@cs/shared";
import { NodeIcon } from "@entities/file";
import { describeTrashItem, useGetTrashQuery } from "@entities/trash";
import { PurgeAllButton, PurgeNodeButton, PurgeSelectedButton } from "@features/purge-trash";
import { RestoreNodeButton, RestoreSelectedButton } from "@features/restore-from-trash";
import { formatDate, usePagedList } from "@shared/lib";
import { Button, Checkbox, EmptyState, LoadMore, Skeleton } from "@shared/ui";

import styles from "./trash-explorer.module.scss";

const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => index);

/** Состояние чекбокса «выбрать все»: Radix понимает `indeterminate` как значение. */
const selectAllState = (selectedCount: number, total: number): boolean | "indeterminate" => {
  if (selectedCount === 0) {
    return false;
  }

  return selectedCount === total ? true : "indeterminate";
};

/**
 * Корзина показывает корни удалений: содержимое удалённой папки отдельными
 * строками не выводится, потому что restore/purge работают с поддеревом целиком.
 * Выбор живёт локально (`Set` id): сервер про выделение не знает, а после
 * восстановления или удаления список приходит заново, и выбор сбрасывается.
 */
export const TrashExplorer = () => {
  const { limit, canExpand, loadMore } = usePagedList("trash");
  const { data, isLoading, isError, isFetching, refetch } = useGetTrashQuery({ limit });
  const items = data?.items ?? [];
  const hasMore = canExpand && Boolean(data?.nextCursor);

  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  const toggleItem = (item: TrashItem): void => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }

      return next;
    });
  };

  const toggleAll = (checked: boolean): void => {
    setSelectedIds(checked ? new Set(items.map((item) => item.id)) : new Set());
  };

  const clearSelection = (): void => {
    setSelectedIds(new Set());
  };

  return (
    <section className={styles.root} aria-labelledby="trash-title">
      <header className={styles.header}>
        <div className={styles.headText}>
          <h1 className={styles.title} id="trash-title">
            Корзина
          </h1>
          <p className={styles.subtitle}>
            Удалённые объекты занимают место в хранилище, пока вы не удалите их навсегда.
          </p>
        </div>
        <div className={styles.toolbar}>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw size={14} aria-hidden="true" />}
            loading={isFetching && !isLoading}
            onClick={() => void refetch()}
          >
            Обновить
          </Button>
          <PurgeAllButton items={items} />
        </div>
      </header>

      {isLoading ? (
        <ul className={styles.list} aria-busy="true" aria-label="Загрузка корзины">
          {SKELETON_ROWS.map((index) => (
            <li key={index} className={styles.rowItem}>
              <div className={styles.row}>
                <Skeleton width={20} height={20} />
                <Skeleton height={14} />
              </div>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <EmptyState
          icon={<Trash2 size={28} aria-hidden="true" />}
          title="Не удалось загрузить корзину"
          description="Проверьте соединение и попробуйте снова."
          action={<Button onClick={() => void refetch()}>Повторить</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Trash2 size={28} aria-hidden="true" />}
          title="Корзина пуста"
          description="Сюда попадают удалённые файлы и папки — их можно восстановить."
        />
      ) : (
        <>
          <div className={styles.selection}>
            <Checkbox
              aria-label="Выбрать все"
              checked={selectAllState(selectedItems.length, items.length)}
              onCheckedChange={(value) => toggleAll(value === true)}
            />
            <span className={styles.selectionText}>
              {selectedItems.length > 0 ? `Выбрано: ${selectedItems.length}` : "Выбрать все"}
            </span>
            {selectedItems.length > 0 ? (
              <div className={styles.selectionActions}>
                <RestoreSelectedButton
                  ids={selectedItems.map((item) => item.id)}
                  onRestored={clearSelection}
                />
                <PurgeSelectedButton
                  ids={selectedItems.map((item) => item.id)}
                  onPurged={clearSelection}
                />
              </div>
            ) : null}
          </div>

          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.rowItem}>
                <div className={styles.row}>
                  <Checkbox
                    aria-label={`Выбрать «${item.name}»`}
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleItem(item)}
                  />
                  <NodeIcon node={item} />
                  <span className={styles.main}>
                    <span className={styles.name}>{item.name}</span>
                    <span className={styles.meta}>
                      {describeTrashItem(item)}
                      <span className={styles.dot} aria-hidden="true">
                        ·
                      </span>
                      Удалён {formatDate(item.deletedAt)}
                    </span>
                  </span>
                  <span className={styles.actions}>
                    <RestoreNodeButton item={item} />
                    <PurgeNodeButton item={item} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {isLoading || isError ? null : (
        <LoadMore
          hasMore={hasMore}
          loadedCount={items.length}
          loading={isFetching && !isLoading}
          onLoadMore={loadMore}
        />
      )}
    </section>
  );
};
