import { delay, http, HttpResponse } from "msw";

import {
  API_ROUTES,
  ApiErrorCode,
  FileStatus,
  moveNodePayloadSchema,
  renameNodePayloadSchema,
  uploadCompletePayloadSchema,
  uploadInitPayloadSchema,
} from "@cs/shared";

import { findFile, getDb } from "../db";
import { mockLatency } from "../latency";
import {
  completeMockUpload,
  createUploadingFile,
  deleteMockNode,
  mockFileContent,
  moveMockNode,
  renameMockNode,
} from "../node-ops";
import { conflict, jsonError, notFound, unauthorized, validationFailed } from "../response";
import { apiRoute } from "../route";

/** Сколько живёт ссылка на загрузку тела файла. */
const UPLOAD_URL_TTL_MS = 15 * 60 * 1000;

const guard = (): Response | null => (getDb().session ? null : unauthorized());

export const fileHandlers = [
  http.post(apiRoute(API_ROUTES.files.uploadInit), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = uploadInitPayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите имя, размер и тип файла");
    }

    const result = createUploadingFile(parsed.data);

    if (!result.ok) {
      switch (result.reason) {
        case "folder-not-found":
          return notFound(`Папка ${parsed.data.folderId ?? ""} не найдена`);
        case "too-large":
          return jsonError(413, ApiErrorCode.PayloadTooLarge, "Файл больше 100 МБ");
        case "quota-exceeded":
          return jsonError(413, ApiErrorCode.QuotaExceeded, "Недостаточно свободного места");
        default:
          return conflict("Файл с таким именем уже существует");
      }
    }

    return HttpResponse.json(
      {
        file: result.file,
        uploadUrl: apiRoute(API_ROUTES.files.mockUpload(result.file.id)),
        expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_MS).toISOString(),
      },
      { status: 201 },
    );
  }),

  /** Мок тело не хранит, но проверяет статус файла. */
  http.put(apiRoute(API_ROUTES.files.mockUpload(":fileId")), async ({ params, request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const fileId = String(params.fileId);
    const file = findFile(fileId);

    if (!file || file.status !== FileStatus.Uploading) {
      return notFound(`Загрузка ${fileId} не найдена`);
    }

    await request.arrayBuffer();

    return new HttpResponse(null, { status: 204 });
  }),

  /** Шаг 3: файл становится `ready`, квота пересчитывается. */
  http.post(apiRoute(API_ROUTES.files.uploadComplete), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = uploadCompletePayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Некорректные данные завершения загрузки");
    }

    const file = completeMockUpload(parsed.data.fileId, parsed.data.checksum);

    if (!file) {
      return conflict("Загрузка уже завершена или не найдена");
    }

    return HttpResponse.json(file);
  }),

  http.get(apiRoute(API_ROUTES.files.download(":fileId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const fileId = String(params.fileId);
    const file = findFile(fileId);

    if (!file || file.status !== FileStatus.Ready) {
      return notFound(`Файл ${fileId} не найден`);
    }

    const { content, mimeType } = mockFileContent(file);

    return new HttpResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      },
    });
  }),

  http.patch(apiRoute(API_ROUTES.files.byId(":fileId")), async ({ params, request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = renameNodePayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success || !parsed.data.name.trim()) {
      return validationFailed("Укажите корректное имя файла");
    }

    const fileId = String(params.fileId);
    const result = renameMockNode(fileId, parsed.data.name);

    if (!result.ok) {
      return result.reason === "not-found"
        ? notFound(`Файл ${fileId} не найден`)
        : conflict("Файл с таким именем уже существует");
    }

    return HttpResponse.json(result.node);
  }),

  http.post(apiRoute(API_ROUTES.files.move(":fileId")), async ({ params, request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = moveNodePayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите папку назначения");
    }

    const fileId = String(params.fileId);
    const result = moveMockNode(fileId, parsed.data.targetFolderId);

    if (!result.ok) {
      switch (result.reason) {
        case "not-found":
          return notFound(`Файл ${fileId} не найден`);
        case "target-not-found":
          return notFound(`Папка ${parsed.data.targetFolderId ?? ""} не найдена`);
        default:
          return conflict("В папке уже есть файл с таким именем");
      }
    }

    return HttpResponse.json(result.node);
  }),

  http.delete(apiRoute(API_ROUTES.files.byId(":fileId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    if (!deleteMockNode(String(params.fileId))) {
      return notFound(`Файл ${String(params.fileId)} не найден`);
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
