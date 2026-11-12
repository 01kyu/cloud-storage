"use client";

import { Link2, RefreshCw } from "lucide-react";

import { useGetSharesQuery } from "@entities/share";
import { usePagedList } from "@shared/lib";
import { Button, EmptyState, LoadMore, Skeleton } from "@shared/ui";

import { ShareRow } from "./share-row";
import styles from "./shares-explorer.module.scss";

const SKELETON_ROWS = Array.from({ length: 3 }, (_, index) => index);

/**
 * Ссылка живёт, пока существует её объект: удалённый в корзину файл исчезает
 * из списка сам, потому что мок фильтрует «висячие» шары.
 */
export const SharesExplorer = () => {
  const { limit, canExpand, loadMore } = usePagedList("shares");
  const { data, isLoading, isError, isFetching, refetch } = useGetSharesQuery({ limit });
  const items = data?.items ?? [];
  const hasMore = canExpand && Boolean(data?.nextCursor);

  return (
    <section className={styles.root} aria-labelledby="shares-title">
      <header className={styles.header}>
        <div className={styles.headText}>
          <h1 className={styles.title} id="shares-title">
            Общий доступ
          </h1>
          <p className={styles.subtitle}>
            Публичные ссылки открываются без входа. Ссылку можно отозвать в любой момент.
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
        </div>
      </header>

      {isLoading ? (
        <ul className={styles.list} aria-busy="true" aria-label="Загрузка ссылок">
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
          icon={<Link2 size={28} aria-hidden="true" />}
          title="Не удалось загрузить ссылки"
          description="Проверьте соединение и попробуйте снова."
          action={<Button onClick={() => void refetch()}>Повторить</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Link2 size={28} aria-hidden="true" />}
          title="Публичных ссылок нет"
          description="Откройте меню файла или папки и выберите «Поделиться»."
        />
      ) : (
        <ul className={styles.list}>
          {items.map((share) => (
            <li key={share.id} className={styles.rowItem}>
              <ShareRow share={share} />
            </li>
          ))}
        </ul>
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
