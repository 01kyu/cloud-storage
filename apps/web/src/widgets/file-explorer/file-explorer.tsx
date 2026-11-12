"use client";

import { useEffect } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { FolderOpen, RefreshCw } from "lucide-react";

import { useGetBreadcrumbsQuery, useGetFolderChildrenQuery } from "@entities/folder";
import { CreateFolderButton } from "@features/create-folder";
import {
  selectSort,
  selectViewMode,
  serializeSort,
  SortControl,
  useExplorerSelector,
  useExplorerUrlSync,
  ViewModeControl,
} from "@features/toggle-view";
import { UploadButton, UploadDropzone, UploadQueue } from "@features/upload-files";
import { ROUTES } from "@shared/config";
import { usePagedList } from "@shared/lib";
import { Breadcrumbs, Button, EmptyState, LoadMore, Skeleton } from "@shared/ui";

import styles from "./file-explorer.module.scss";
import { NodeGrid } from "./node-grid";
import { nodeRowId } from "./node-highlight";
import { NodeList } from "./node-list";

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

export type FileExplorerProps = {
  folderId: string | null;
  /** id объекта из `?highlight=` — возврат к результату поиска. */
  highlightNodeId?: string | null;
  /** Запрос из `?q=` — подсветка совпадения в имени. */
  highlightQuery?: string;
};

/** Сортировка уходит в API параметром `sort=field:direction`. */
export const FileExplorer = ({
  folderId,
  highlightNodeId = null,
  highlightQuery = "",
}: FileExplorerProps) => {
  const viewMode = useExplorerSelector(selectViewMode);
  const sort = useExplorerSelector(selectSort);
  const sortParam = serializeSort(sort);

  useExplorerUrlSync();

  const { limit, canExpand, loadMore } = usePagedList(`${folderId ?? "root"}:${sortParam}`);
  const { data, isLoading, isError, isFetching, refetch } = useGetFolderChildrenQuery({
    folderId,
    sort: sortParam,
    limit,
  });
  const { data: breadcrumbs } = useGetBreadcrumbsQuery(folderId ?? skipToken);

  const items = data?.items ?? [];
  const hasMore = canExpand && Boolean(data?.nextCursor);
  const title = breadcrumbs?.at(-1)?.name ?? "Все файлы";
  const crumbs = [
    { id: "root", label: "Все файлы", href: ROUTES.files },
    ...(breadcrumbs ?? []).map((crumb) => ({
      id: crumb.id,
      label: crumb.name,
      href: ROUTES.folder(crumb.id),
    })),
  ];

  /** Возврат из поиска: подводим найденный объект в зону видимости один раз. */
  useEffect(() => {
    if (!highlightNodeId || isLoading) {
      return;
    }

    document.getElementById(nodeRowId(highlightNodeId))?.scrollIntoView?.({ block: "center" });
  }, [highlightNodeId, isLoading, items.length]);

  return (
    <section className={styles.root} aria-labelledby="file-explorer-title">
      <Breadcrumbs items={crumbs} />

      <header className={styles.header}>
        <h1 className={styles.title} id="file-explorer-title">
          {title}
        </h1>
        <div className={styles.toolbar}>
          <UploadButton folderId={folderId} />
          <CreateFolderButton parentId={folderId} />
          <ViewModeControl />
          <SortControl />
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

      <UploadQueue />

      <UploadDropzone folderId={folderId}>
        {isLoading ? (
          <ul className={styles.list} aria-busy="true" aria-label="Загрузка содержимого">
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
            icon={<FolderOpen size={28} aria-hidden="true" />}
            title="Не удалось загрузить папку"
            description="Проверьте соединение и попробуйте снова."
            action={<Button onClick={() => void refetch()}>Повторить</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} aria-hidden="true" />}
            title={folderId ? "В папке пусто" : "Файлов пока нет"}
            description="Здесь появятся загруженные файлы и созданные папки."
          />
        ) : viewMode === "grid" ? (
          <NodeGrid
            items={items}
            highlightNodeId={highlightNodeId}
            highlightQuery={highlightQuery}
          />
        ) : (
          <NodeList
            items={items}
            highlightNodeId={highlightNodeId}
            highlightQuery={highlightQuery}
          />
        )}
      </UploadDropzone>

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
