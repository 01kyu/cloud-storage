import { delay, http, HttpResponse } from "msw";

import {
  API_ROUTES,
  createFolderPayloadSchema,
  moveNodePayloadSchema,
  renameNodePayloadSchema,
} from "@cs/shared";

import {
  childNodes,
  createMockFolder,
  findFolder,
  folderBreadcrumbs,
  folderTree,
  getDb,
} from "../db";
import { mockLatency } from "../latency";
import { deleteMockNode, moveMockNode, renameMockNode } from "../node-ops";
import { listNodes, readListQuery } from "../query";
import { conflict, notFound, unauthorized, validationFailed } from "../response";
import { apiRoute } from "../route";

const guard = (): Response | null => (getDb().session ? null : unauthorized());

export const folderHandlers = [
  http.post(apiRoute(API_ROUTES.folders.create), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = createFolderPayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите корректное название папки");
    }

    if (!parsed.data.name.trim()) {
      return validationFailed("Название папки не может быть пустым");
    }

    const result = createMockFolder(parsed.data.name, parsed.data.parentId);

    if (!result.ok) {
      return result.reason === "parent-not-found"
        ? notFound(`Папка ${parsed.data.parentId ?? ""} не найдена`)
        : conflict("Папка с таким именем уже существует");
    }

    return HttpResponse.json(result.folder, { status: 201 });
  }),

  http.get(apiRoute(API_ROUTES.folders.tree), async () => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    return HttpResponse.json(folderTree());
  }),

  http.get(apiRoute(API_ROUTES.folders.root), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    return HttpResponse.json(listNodes(childNodes(null), readListQuery(request)));
  }),

  http.get(apiRoute(API_ROUTES.folders.children(":folderId")), async ({ params, request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const folderId = String(params.folderId);

    if (!findFolder(folderId)) {
      return notFound(`Папка ${folderId} не найдена`);
    }

    return HttpResponse.json(listNodes(childNodes(folderId), readListQuery(request)));
  }),

  http.get(apiRoute(API_ROUTES.folders.breadcrumbs(":folderId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const folderId = String(params.folderId);

    if (!findFolder(folderId)) {
      return notFound(`Папка ${folderId} не найдена`);
    }

    return HttpResponse.json(folderBreadcrumbs(folderId));
  }),

  http.patch(apiRoute(API_ROUTES.folders.byId(":folderId")), async ({ params, request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = renameNodePayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success || !parsed.data.name.trim()) {
      return validationFailed("Укажите корректное название папки");
    }

    const folderId = String(params.folderId);
    const result = renameMockNode(folderId, parsed.data.name);

    if (!result.ok) {
      return result.reason === "not-found"
        ? notFound(`Папка ${folderId} не найдена`)
        : conflict("Папка с таким именем уже существует");
    }

    return HttpResponse.json(result.node);
  }),

  /** `path` и `depth` всего поддерева пересчитываются. */
  http.post(apiRoute(API_ROUTES.folders.move(":folderId")), async ({ params, request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = moveNodePayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите папку назначения");
    }

    const folderId = String(params.folderId);
    const result = moveMockNode(folderId, parsed.data.targetFolderId);

    if (!result.ok) {
      switch (result.reason) {
        case "not-found":
          return notFound(`Папка ${folderId} не найдена`);
        case "target-not-found":
          return notFound(`Папка ${parsed.data.targetFolderId ?? ""} не найдена`);
        case "self-target":
          return validationFailed("Нельзя переместить папку внутрь себя");
        default:
          return conflict("Папка с таким именем уже существует");
      }
    }

    return HttpResponse.json(result.node);
  }),

  /** Мягкое удаление: папка со всем поддеревом уходит в корзину. */
  http.delete(apiRoute(API_ROUTES.folders.byId(":folderId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    if (!deleteMockNode(String(params.folderId))) {
      return notFound(`Папка ${String(params.folderId)} не найдена`);
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
