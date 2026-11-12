import { API_ROUTES } from "@cs/shared";
import { getApiBaseUrl } from "@shared/api";
import { ApiRequestError } from "@shared/lib";

export type PublicShareFileRequest = {
  token: string;
  password?: string;
};

/**
 * Гость скачивает файл без сессии, поэтому `credentials: "omit"`: cookie
 * владельца не должны попасть в публичный запрос.
 */
export const fetchPublicShareBlob = async ({
  token,
  password,
}: PublicShareFileRequest): Promise<Blob> => {
  const url = new URL(`${getApiBaseUrl()}${API_ROUTES.shares.publicDownload(token)}`);

  if (password) {
    url.searchParams.set("password", password);
  }

  const response = await fetch(url.toString(), { credentials: "omit" });

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => undefined);

    throw new ApiRequestError(data);
  }

  return response.blob();
};
