import { File, FileArchive, FileAudio, FileImage, FileText, FileVideo, Folder } from "lucide-react";

import { FileKind, NodeType, type Node } from "@cs/shared";
import { cn } from "@shared/lib";

import styles from "./node-icon.module.scss";

const KIND_ICONS = {
  [FileKind.Image]: FileImage,
  [FileKind.Video]: FileVideo,
  [FileKind.Audio]: FileAudio,
  [FileKind.Document]: FileText,
  [FileKind.Archive]: FileArchive,
  [FileKind.Other]: File,
} as const;

export type NodeIconProps = {
  node: Node;
  size?: number;
  className?: string;
};

export const NodeIcon = ({ node, size = 20, className }: NodeIconProps) => {
  if (node.type === NodeType.Folder) {
    return (
      <Folder
        size={size}
        aria-hidden="true"
        className={cn(styles.root, styles.folder, className)}
      />
    );
  }

  const Icon = KIND_ICONS[node.kind];

  return (
    <Icon
      size={size}
      aria-hidden="true"
      className={cn(styles.root, styles[node.kind], className)}
    />
  );
};
