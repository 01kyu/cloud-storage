"use client";

import { formatBytes, NodeType, type Node } from "@cs/shared";
import { describeFile, NodeIcon } from "@entities/file";
import { formatDate } from "@shared/lib";

import styles from "./file-explorer.module.scss";
import { NodeActions } from "./node-actions";
import { NodeLink } from "./node-link";

export type NodeListProps = {
  items: Node[];
};

export const NodeList = ({ items }: NodeListProps) => (
  <ul className={styles.list} data-view="list">
    {items.map((node) => (
      <li key={node.id} className={styles.rowItem}>
        <div className={styles.row}>
          <NodeActions node={node}>
            <NodeLink node={node} className={styles.rowLink}>
              <NodeIcon node={node} />
              <span className={styles.rowMain}>
                <span className={styles.rowName}>{node.name}</span>
                <span className={styles.rowMeta}>
                  {node.type === NodeType.Folder
                    ? `${node.childCount} объектов`
                    : describeFile(node)}
                  <span className={styles.dot} aria-hidden="true">
                    ·
                  </span>
                  {formatBytes(node.size)}
                </span>
              </span>
            </NodeLink>
          </NodeActions>
          <span className={styles.rowDate}>{formatDate(node.updatedAt)}</span>
        </div>
      </li>
    ))}
  </ul>
);
