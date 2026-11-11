"use client";

import { NodeType, type Node } from "@cs/shared";
import { describeFile, NodeIcon } from "@entities/file";
import { formatDate } from "@shared/lib";

import styles from "./file-explorer.module.scss";
import { NodeActions } from "./node-actions";
import { NodeLink } from "./node-link";

export type NodeGridProps = {
  items: Node[];
};

export const NodeGrid = ({ items }: NodeGridProps) => (
  <ul className={styles.grid} data-view="grid">
    {items.map((node) => (
      <li key={node.id} className={styles.cardItem}>
        <div className={styles.card}>
          <NodeActions node={node}>
            <NodeLink node={node} className={styles.cardLink}>
              <NodeIcon node={node} size={32} />
              <span className={styles.cardName}>{node.name}</span>
              <span className={styles.cardMeta}>
                {node.type === NodeType.Folder ? `${node.childCount} объектов` : describeFile(node)}
              </span>
              <span className={styles.cardDate}>{formatDate(node.updatedAt)}</span>
            </NodeLink>
          </NodeActions>
        </div>
      </li>
    ))}
  </ul>
);
