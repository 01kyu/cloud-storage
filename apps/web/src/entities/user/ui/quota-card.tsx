"use client";

import { formatBytes } from "@cs/shared";
import { cn } from "@shared/lib";
import { Progress, Skeleton } from "@shared/ui";

import { getQuotaPercent, getQuotaState } from "../lib/quota";

import styles from "./quota-card.module.scss";

export type QuotaCardProps = {
  used: number;
  quota: number;
  loading?: boolean;
  className?: string;
};

export const QuotaCard = ({ used, quota, loading = false, className }: QuotaCardProps) => {
  const percent = getQuotaPercent(used, quota);
  const state = getQuotaState(percent);

  return (
    <section className={cn(styles.root, className)} aria-label="Использование хранилища">
      {loading ? (
        <>
          <Skeleton height={12} width="70%" />
          <Skeleton height={6} />
        </>
      ) : (
        <>
          <p className={styles.label}>
            <span className={styles.used}>{formatBytes(used)}</span>
            <span className={styles.muted}> из {formatBytes(quota)}</span>
          </p>
          <Progress
            value={percent}
            size="sm"
            aria-label={`Занято ${Math.round(percent)}% хранилища`}
            className={cn(styles.progress, styles[state])}
          />
        </>
      )}
    </section>
  );
};
