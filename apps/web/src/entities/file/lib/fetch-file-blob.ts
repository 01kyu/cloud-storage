import { API_ROUTES } from "@cs/shared";
import { getApiBaseUrl } from "@shared/api";
import { ApiRequestError } from "@shared/lib";

/**
 * `Blob` не кладём в кэш RTK Query — значение несериализуемо. Тело ошибки
 * уходит в `ApiRequestError`, чтобы `getApiErrorMessage` читал контракт так же.
 */
export const fetchFileBlob = async (fileId: string): Promise<Blob> => {
  const response = await fetch(`${getApiBaseUrl()}${API_ROUTES.files.download(fileId)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => undefined);

    throw new ApiRequestError(data);
  }

  return response.blob();
};
