import { z } from "zod";

export const NodeType = {
  Folder: "folder",
  File: "file",
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export const nodeTypeSchema = z.enum([NodeType.Folder, NodeType.File]);
