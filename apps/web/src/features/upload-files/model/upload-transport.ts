import { checksumOf } from "@shared/lib";

/** `AbortController` несериализуем, поэтому живёт в модуле, а не в Redux. */
const controllers = new Map<string, AbortController>();

export const registerUploadController = (id: string): AbortController => {
  const controller = new AbortController();

  controllers.set(id, controller);

  return controller;
};

export const releaseUploadController = (id: string): void => {
  controllers.delete(id);
};

export const abortUpload = (id: string): void => {
  controllers.get(id)?.abort();
  controllers.delete(id);
};

/** Тот же `PUT`, что пойдёт в S3/MinIO по presigned URL. */
export const putFileBody = async (
  uploadUrl: string,
  file: File,
  signal: AbortSignal,
): Promise<void> => {
  const url = new URL(uploadUrl, window.location.origin).toString();
  const response = await fetch(url, { method: "PUT", body: file, signal });

  if (!response.ok) {
    throw new Error(`Не удалось передать файл: ${response.status}`);
  }
};

/** 64 hex-символа вместо SHA-256: мок не читает тело файла. */
export const fileChecksum = (file: File): string => checksumOf(`${file.name}:${file.size}`);
