import { delay, http, HttpResponse } from "msw";

import {
  API_ROUTES,
  ApiErrorCode,
  createSharePayloadSchema,
  FileStatus,
  NodeType,
  SharePermission,
} from "@cs/shared";

import { findNode, getDb, type MockShare } from "../db";
import { mockLatency } from "../latency";
import { mockFileContent } from "../node-ops";
import { paginate, readListQuery } from "../query";
import { forbidden, gone, jsonError, notFound, unauthorized, validationFailed } from "../response";
import { apiRoute } from "../route";
import {
  createMockShare,
  deleteMockShare,
  findShareByToken,
  isShareExpired,
  listShares,
  matchesSharePassword,
  publicShareOf,
  shareRecord,
} from "../share-ops";

const guard = (): Response | null => (getDb().session ? null : unauthorized());

type PublicShareAccess = { share: MockShare } | { error: Response };

/**
 * Публичные хендлеры намеренно не смотрят на сессию: ссылку открывает гость.
 * Порядок проверок — существование, срок, пароль; 410 и 403 клиент различает.
 */
const resolvePublicShare = (token: string, password: string | null): PublicShareAccess => {
  const share = findShareByToken(token);

  if (!share) {
    return { error: notFound(`Ссылка ${token} не найдена`) };
  }

  if (isShareExpired(share)) {
    return { error: gone("Срок действия ссылки истёк") };
  }

  if (!matchesSharePassword(share, password)) {
    return {
      error: jsonError(401, ApiErrorCode.Unauthorized, "Ссылка защищена паролем"),
    };
  }

  return { share };
};

const passwordOf = (request: Request): string | null =>
  new URL(request.url).searchParams.get("password");

export const shareHandlers = [
  http.get(apiRoute(API_ROUTES.shares.list), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const { cursor, limit } = readListQuery(request);

    return HttpResponse.json(paginate(listShares(), cursor, limit));
  }),

  http.post(apiRoute(API_ROUTES.shares.create), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = createSharePayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите объект и права доступа");
    }

    if (parsed.data.expiresAt && Date.parse(parsed.data.expiresAt) <= Date.now()) {
      return validationFailed("Срок действия должен быть в будущем");
    }

    const result = createMockShare(parsed.data);

    if (!result.ok) {
      return result.reason === "node-not-found"
        ? notFound(`Объект ${parsed.data.nodeId} не найден`)
        : validationFailed("Тип объекта не совпадает с сохранённым");
    }

    return HttpResponse.json(shareRecord(result.share), { status: 201 });
  }),

  http.delete(apiRoute(API_ROUTES.shares.byId(":shareId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const shareId = String(params.shareId);

    if (!deleteMockShare(shareId)) {
      return notFound(`Ссылка ${shareId} не найдена`);
    }

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(apiRoute(API_ROUTES.shares.public(":token")), async ({ params, request }) => {
    await delay(mockLatency());

    const access = resolvePublicShare(String(params.token), passwordOf(request));

    if ("error" in access) {
      return access.error;
    }

    const view = publicShareOf(access.share);

    return view ? HttpResponse.json(view) : notFound("Объект ссылки больше не существует");
  }),

  /** Скачивание доступно только ссылкам с правом `download`; папку отдаём как 400. */
  http.get(apiRoute(API_ROUTES.shares.publicDownload(":token")), async ({ params, request }) => {
    await delay(mockLatency());

    const access = resolvePublicShare(String(params.token), passwordOf(request));

    if ("error" in access) {
      return access.error;
    }

    if (access.share.permission !== SharePermission.Download) {
      return forbidden("Ссылка разрешает только просмотр");
    }

    const node = findNode(access.share.nodeId);

    if (!node || node.type !== NodeType.File) {
      return validationFailed("Папку нельзя скачать по ссылке");
    }

    if (node.status !== FileStatus.Ready) {
      return notFound(`Файл ${node.id} не найден`);
    }

    const { content, mimeType } = mockFileContent(node);

    return new HttpResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(node.name)}`,
      },
    });
  }),
];
