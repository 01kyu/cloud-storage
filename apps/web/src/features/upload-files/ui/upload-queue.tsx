"use client";

import { X } from "lucide-react";

import { formatBytes } from "@cs/shared";
import { IconButton, Progress } from "@shared/ui";

import { isFinishedUpload, type UploadStatus } from "../model/upload-queue-slice";
import { useUploadQueue } from "../model/use-upload-files";

import styles from "./upload-queue.module.scss";

const STATUS_LABELS: Record<UploadStatus, string> = {
  queued: "В очереди",
  uploading: "Загрузка",
  succeeded: "Готово",
  failed: "Ошибка",
  canceled: "Отменено",
};

export const UploadQueue = () => {
  const { items, cancel, dismiss, clearFinished } = useUploadQueue();

  if (items.length === 0) {
    return null;
  }

  const finished = items.filter(isFinishedUpload);

  return (
    <section className={styles.root} aria-label="Очередь загрузки">
      <header className={styles.header}>
        <h2 className={styles.title}>Загрузки</h2>
        {finished.length > 0 ? (
          <button type="button" className={styles.clear} onClick={clearFinished}>
            Очистить завершённые
          </button>
        ) : null}
      </header>

      <ul className={styles.list}>
        {items.map((item) => {
          const isFinished = isFinishedUpload(item);

          return (
            <li key={item.id} className={styles.item}>
              <div className={styles.info}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.meta}>
                  {formatBytes(item.size)} · {STATUS_LABELS[item.status]}
                </span>
              </div>

              <Progress value={item.progress} size="sm" aria-label={`Прогресс: ${item.name}`} />

              {item.error ? (
                <p className={styles.error} role="alert">
                  {item.error}
                </p>
              ) : null}

              <IconButton
                size="sm"
                label={
                  isFinished
                    ? `Убрать «${item.name}» из очереди`
                    : `Отменить загрузку «${item.name}»`
                }
                onClick={() => {
                  if (isFinished) {
                    dismiss(item.id);
                  } else {
                    cancel(item.id);
                  }
                }}
              >
                <X size={14} aria-hidden="true" />
              </IconButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
