import { z } from "zod";

export const FileKind = {
  Image: "image",
  Video: "video",
  Audio: "audio",
  Document: "document",
  Archive: "archive",
  Other: "other",
} as const;

export type FileKind = (typeof FileKind)[keyof typeof FileKind];

export const fileKindSchema = z.enum([
  FileKind.Image,
  FileKind.Video,
  FileKind.Audio,
  FileKind.Document,
  FileKind.Archive,
  FileKind.Other,
]);

export const FileStatus = {
  Uploading: "uploading",
  Ready: "ready",
  Failed: "failed",
} as const;

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];

export const fileStatusSchema = z.enum([FileStatus.Uploading, FileStatus.Ready, FileStatus.Failed]);
