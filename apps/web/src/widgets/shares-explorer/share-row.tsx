"use client";

import Link from "next/link";
import { FileText, Folder, Link2Off } from "lucide-react";

import { NodeType, type Share } from "@cs/shared";
import { describeShare, useDeleteShareMutation } from "@entities/share";
import { CopyShareLinkButton } from "@features/copy-share-link";
import { ROUTES } from "@shared/config";
import { getApiErrorMessage, useOrigin } from "@shared/lib";
import { Button, showErrorToast, showSuccessToast } from "@shared/ui";

import styles from "./shares-explorer.module.scss";

export type ShareRowProps = {
  share: Share;
};

/**
 * В `Share` нет самого узла, поэтому иконка выбирается по `nodeType`:
 * `NodeIcon` требует полный `Node` с видом файла.
 */
export const ShareRow = ({ share }: ShareRowProps) => {
  const [deleteShare, { isLoading }] = useDeleteShareMutation();
  const origin = useOrigin();
  const url = `${origin}${ROUTES.publicShare(share.token)}`;
  const Icon = share.nodeType === NodeType.Folder ? Folder : FileText;

  const handleRevoke = async (): Promise<void> => {
    try {
      await deleteShare(share.id).unwrap();
      showSuccessToast(`Ссылка на «${share.nodeName}» отозвана`);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, "Не удалось отозвать ссылку. Попробуйте ещё раз"));
    }
  };

  return (
    <div className={styles.row}>
      <Icon size={20} aria-hidden="true" className={styles.icon} />
      <span className={styles.main}>
        <span className={styles.name}>{share.nodeName}</span>
        <span className={styles.meta}>{describeShare(share)}</span>
      </span>
      <span className={styles.actions}>
        <Link
          className={styles.openLink}
          href={ROUTES.publicShare(share.token)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Открыть ссылку на ${share.nodeName}`}
        >
          Открыть
        </Link>
        <CopyShareLinkButton url={url} />
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<Link2Off size={14} aria-hidden="true" />}
          loading={isLoading}
          aria-label={`Отозвать ссылку на ${share.nodeName}`}
          onClick={() => void handleRevoke()}
        >
          Отозвать
        </Button>
      </span>
    </div>
  );
};
