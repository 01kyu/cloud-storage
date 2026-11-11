import type { ReactNode } from "react";

import { cn } from "@shared/lib";

import styles from "./EmptyState.module.scss";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn(styles.root, className)}>
    {icon ? (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    ) : null}
    <p className={styles.title}>{title}</p>
    {description ? <p className={styles.description}>{description}</p> : null}
    {action ? <div className={styles.action}>{action}</div> : null}
  </div>
);
