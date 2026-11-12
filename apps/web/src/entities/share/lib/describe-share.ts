import { formatBytes, NodeType, SharePermission, type Share } from "@cs/shared";
import { formatDate } from "@shared/lib";

const PERMISSION_LABELS: Record<SharePermission, string> = {
  [SharePermission.Read]: "только просмотр",
  [SharePermission.Download]: "просмотр и скачивание",
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  [NodeType.Folder]: "Папка",
  [NodeType.File]: "Файл",
};

export const describeSharePermission = (permission: SharePermission): string =>
  PERMISSION_LABELS[permission];

/** `null` — бессрочная ссылка: контракт разрешает не задавать срок. */
export const describeShareExpiry = (expiresAt: string | null): string =>
  expiresAt === null ? "бессрочно" : `до ${formatDate(expiresAt)}`;

/** `size` есть только у файла: у папки в шаре его нет. */
export const describeShare = (share: Share, size?: number): string =>
  [
    `${NODE_TYPE_LABELS[share.nodeType]} · ${describeSharePermission(share.permission)}`,
    describeShareExpiry(share.expiresAt),
    size === undefined ? null : formatBytes(size),
    share.hasPassword ? "по паролю" : null,
  ]
    .filter(Boolean)
    .join(" · ");
