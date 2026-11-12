"use client";

import { formatBytes, NodeType, type Node } from "@cs/shared";
import { describeFile, NodeIcon } from "@entities/file";
import { cn, formatDate } from "@shared/lib";

import styles from "./file-explorer.module.scss";
import { NodeActions } from "./node-actions";
import { HighlightedName, nodeRowId, type NodeHighlightProps } from "./node-highlight";
import { NodeLink } from "./node-link";

export type NodeListProps = NodeHighlightProps & {
  items: Node[];
};

export const NodeList = ({ items, highlightNodeId = null, highlightQuery = "" }: NodeListProps) => (
  <ul className={styles.list} data-view="list">
    {items.map((node) => {
      const isHighlighted = node.id === highlightNodeId;

      return (
        <li key={node.id} id={nodeRowId(node.id)} className={styles.rowItem}>
          <div className={styles.row}>
            <NodeActions node={node}>
              <NodeLink
                node={node}
                className={cn(styles.rowLink, isHighlighted && styles.highlighted)}
              >
                <NodeIcon node={node} />
                <span className={styles.rowMain}>
                  <span className={styles.rowName}>
                    <HighlightedName text={node.name} query={isHighlighted ? highlightQuery : ""} />
                  </span>
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
      );
    })}
  </ul>
);
