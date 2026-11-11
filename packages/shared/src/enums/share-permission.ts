import { z } from "zod";

export const SharePermission = {
  Read: "read",
  Download: "download",
} as const;

export type SharePermission = (typeof SharePermission)[keyof typeof SharePermission];

export const sharePermissionSchema = z.enum([SharePermission.Read, SharePermission.Download]);
