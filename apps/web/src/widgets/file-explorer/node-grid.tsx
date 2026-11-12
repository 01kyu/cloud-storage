"use client";

import { NodeType, type Node } from "@cs/shared";
import { describeFile, NodeIcon } from "@entities/file";
import { cn, formatDate } from "@shared/lib";

import styles from "./file-explorer.module.scss";
import { NodeActions } from "./node-actions";
import { HighlightedName, nodeRowId, type NodeHighlightProps } from "./node-highlight";
import { NodeLink } from "./node-link";

export type NodeGridProps = NodeHighlightProps & {
  items: Node[];
};

export const NodeGrid = ({ items, highlightNodeId = null, highlightQuery = "" }: NodeGridProps) => (
  <ul className={styles.grid} data-view="grid">
    {items.map((node) => {
      const isHighlighted = node.id === highlightNodeId;

      return (
        <li key={node.id} id={nodeRowId(node.id)} className={styles.cardItem}>
          <div className={styles.card}>
            <NodeActions node={node}>
              <NodeLink
                node={node}
                className={cn(styles.cardLink, isHighlighted && styles.highlighted)}
              >
                <NodeIcon node={node} size={32} />
                <span className={styles.cardName}>
                  <HighlightedName text={node.name} query={isHighlighted ? highlightQuery : ""} />
                </span>
                <span className={styles.cardMeta}>
                  {node.type === NodeType.Folder
                    ? `${node.childCount} объектов`
                    : describeFile(node)}
                </span>
                <span className={styles.cardDate}>{formatDate(node.updatedAt)}</span>
              </NodeLink>
            </NodeActions>
          </div>
        </li>
      );
    })}
  </ul>
);
