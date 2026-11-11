import { API_BASE_PATH } from "@cs/shared";

/** Путь мока от корня: `apiRoute(API_ROUTES.folders.root)` → `/api/v1/folders`. */
export const apiRoute = (path: string): string => `${API_BASE_PATH}${path}`;
