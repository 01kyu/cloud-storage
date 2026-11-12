"use client";

import { useState, type FormEvent } from "react";
import { Download, Link2 } from "lucide-react";

import { NodeType, SharePermission, formatBytes } from "@cs/shared";
import { describeShareExpiry, fetchPublicShareBlob, useGetPublicShareQuery } from "@entities/share";
import { getApiErrorMessage, saveBlob } from "@shared/lib";
import { Button, EmptyState, Field, Input, Skeleton, showErrorToast } from "@shared/ui";

import styles from "./public-share-view.module.scss";

export type PublicShareViewProps = {
  token: string;
};

const errorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const { status } = error as { status?: unknown };

  return typeof status === "number" ? status : undefined;
};

/**
 * Гостевая страница: ни `RequireAuth`, ни сайдбара — ссылку открывает человек
 * без аккаунта. Пароль уходит вторым запросом, а не полем формы первого.
 */
export const PublicShareView = ({ token }: PublicShareViewProps) => {
  const [password, setPassword] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const { data, error, isFetching } = useGetPublicShareQuery({
    token,
    ...(submittedPassword ? { password: submittedPassword } : {}),
  });
  const status = errorStatus(error);

  const handleUnlock = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSubmittedPassword(password);
  };

  const handleDownload = async (): Promise<void> => {
    if (!data) {
      return;
    }

    setIsDownloading(true);

    try {
      const blob = await fetchPublicShareBlob({
        token,
        ...(submittedPassword ? { password: submittedPassword } : {}),
      });

      saveBlob(blob, data.nodeName);
    } catch (cause) {
      showErrorToast(getApiErrorMessage(cause, "Не удалось скачать файл. Попробуйте ещё раз"));
    } finally {
      setIsDownloading(false);
    }
  };

  const renderBody = () => {
    if (status === 404) {
      return (
        <EmptyState
          icon={<Link2 size={28} aria-hidden="true" />}
          title="Ссылка не найдена"
          description="Возможно, владелец её отозвал или удалил объект."
        />
      );
    }

    if (status === 410) {
      return (
        <EmptyState
          icon={<Link2 size={28} aria-hidden="true" />}
          title="Срок действия ссылки истёк"
          description="Попросите владельца создать новую ссылку."
        />
      );
    }

    if (status === 401) {
      return (
        <form className={styles.form} onSubmit={handleUnlock} noValidate>
          <Field label="Пароль" error={submittedPassword ? "Неверный пароль" : undefined} required>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Button type="submit" loading={isFetching}>
            Открыть
          </Button>
        </form>
      );
    }

    if (!data) {
      return (
        <div className={styles.skeleton} aria-busy="true" aria-label="Загрузка ссылки">
          <Skeleton height={20} width={200} />
          <Skeleton height={14} />
          <Skeleton height={36} width={140} />
        </div>
      );
    }

    const isFolder = data.nodeType === NodeType.Folder;
    const canDownload = !isFolder && data.permission === SharePermission.Download;

    return (
      <>
        <h1 className={styles.title} id="public-share-title">
          {data.nodeName}
        </h1>
        <p className={styles.meta}>
          <span>{isFolder ? "Папка" : "Файл"}</span>
          <span aria-hidden="true">·</span>
          <span>{formatBytes(data.size)}</span>
          <span aria-hidden="true">·</span>
          <span>{describeShareExpiry(data.expiresAt)}</span>
        </p>

        {canDownload ? (
          <Button
            loading={isDownloading}
            iconLeft={<Download size={16} aria-hidden="true" />}
            onClick={() => void handleDownload()}
          >
            Скачать
          </Button>
        ) : (
          <p className={styles.hint}>
            {isFolder
              ? "Папку нельзя скачать по ссылке — попросите владельца поделиться файлами."
              : "Ссылка разрешает только просмотр."}
          </p>
        )}
      </>
    );
  };

  return (
    <div className={styles.page}>
      <article className={styles.card} aria-labelledby="public-share-title">
        <span className={styles.badge}>Публичная ссылка</span>
        {renderBody()}
      </article>
    </div>
  );
};
