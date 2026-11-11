import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { NodeType, type Node } from "@cs/shared";
import { useNodeDnd } from "@features/move-node";
import { ROUTES } from "@shared/config";

export type NodeLinkProps = {
  node: Node;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

/**
 * Папка — ссылка, файл — статичная карточка; перетаскивание и drop даёт
 * `move-node`, здесь только DOM-пропсы.
 *
 * `...rest` обязателен: `ContextMenuTrigger asChild` прокидывает в узел свои
 * обработчики, без спреда меню не открывается.
 */
export const NodeLink = ({ node, className, children, ...rest }: NodeLinkProps) => {
  const { dragProps, dropProps, isOver } = useNodeDnd(node);
  const props = { ...rest, ...dragProps, ...dropProps, "data-drop-target": isOver || undefined };

  return node.type === NodeType.Folder ? (
    <Link href={ROUTES.folder(node.id)} className={className} {...props}>
      {children}
    </Link>
  ) : (
    <div className={className} {...props}>
      {children}
    </div>
  );
};
