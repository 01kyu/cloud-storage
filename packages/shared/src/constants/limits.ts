export const LIMITS = {
  maxFileSizeBytes: 100 * 1024 * 1024,
  defaultStorageQuotaBytes: 5 * 1024 * 1024 * 1024,
  maxUploadBatchSize: 20,
  pageSize: 50,
  maxPageSize: 100,
  maxFolderDepth: 20,
  maxNameLength: 255,
  minPasswordLength: 8,
} as const;

export const AUTH = {
  sessionCookieName: "cs_session",
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 30 * 24 * 60 * 60,
} as const;

export const DEMO_USER = {
  email: "demo@cloud.dev",
  password: "demo1234",
} as const;
