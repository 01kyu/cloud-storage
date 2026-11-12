import { HttpResponse } from "msw";

import { ApiErrorCode } from "@cs/shared";

/** Ответ-ошибка по контракту `ApiError`. */
export const jsonError = (statusCode: number, code: ApiErrorCode, message: string) =>
  HttpResponse.json({ statusCode, code, message }, { status: statusCode });

export const validationFailed = (message: string) =>
  jsonError(400, ApiErrorCode.ValidationFailed, message);

export const unauthorized = () =>
  jsonError(401, ApiErrorCode.Unauthorized, "Требуется авторизация");

export const notFound = (message: string) => jsonError(404, ApiErrorCode.NotFound, message);

export const forbidden = (message: string) => jsonError(403, ApiErrorCode.Forbidden, message);

export const conflict = (message: string) => jsonError(409, ApiErrorCode.Conflict, message);

/** Срок жизни публичной ссылки истёк: 410 — «был, но больше нет». */
export const gone = (message: string) => jsonError(410, ApiErrorCode.ShareExpired, message);
