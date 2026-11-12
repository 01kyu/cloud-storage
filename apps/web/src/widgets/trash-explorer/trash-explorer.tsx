"use client";

import { RefreshCw, Trash2 } from "lucide-react";

import { NodeIcon } from "@entities/file";
import { describeTrashItem, useGetTrashQuery } from "@entities/trash";
import { PurgeAllButton, PurgeNodeButton } from "@features/purge-trash";
import { RestoreNodeButton } from "@features/restore-from-trash";
import { formatDate } from "@shared/lib";
import { Button, EmptyState, Skeleton } from "@shared/ui";

import styles from "./trash-explorer.module.scss";

const SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => index);

/**
 * Корзина показывает корни удалений: содержимое удалённой папки отдельными
 * строками не выводится, потому что restore/purge работают с поддеревом целиком.
 */
export const TrashExplorer = () => {
  const { data, isLoading, isError, isFetching, refetch } = useGetTrashQuery();
  const items = data?.items ?? [];

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
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.rowItem}>
              <div className={styles.row}>
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
      )}
    </section>
  );
};
