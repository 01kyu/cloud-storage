import { delay, http, HttpResponse } from "msw";

import { API_ROUTES, purgeTrashPayloadSchema } from "@cs/shared";

import { getDb } from "../db";
import { mockLatency } from "../latency";
import { paginate, readListQuery } from "../query";
import { conflict, notFound, unauthorized, validationFailed } from "../response";
import { apiRoute } from "../route";
import { purgeMockNodes, restoreMockNode, trashRoots } from "../trash-ops";

const guard = (): Response | null => (getDb().session ? null : unauthorized());

const notInTrash = (nodeId: string) => notFound(`Элемент ${nodeId} не найден в корзине`);

export const trashHandlers = [
  /** Квота не меняется: файлы в корзине продолжают занимать место. */
  http.get(apiRoute(API_ROUTES.trash.list), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const { cursor, limit } = readListQuery(request);

    return HttpResponse.json(paginate(trashRoots(), cursor, limit));
  }),

  http.post(apiRoute(API_ROUTES.trash.restore(":nodeId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const nodeId = String(params.nodeId);
    const result = restoreMockNode(nodeId);

    if (!result.ok) {
      return result.reason === "not-found"
        ? notInTrash(nodeId)
        : conflict("Объект с таким именем уже существует");
    }

    return HttpResponse.json(result.node);
  }),

  http.delete(apiRoute(API_ROUTES.trash.byId(":nodeId")), async ({ params }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const nodeId = String(params.nodeId);

    if (!getDb().trash.some((item) => item.id === nodeId)) {
      return notInTrash(nodeId);
    }

    purgeMockNodes([nodeId]);

    return new HttpResponse(null, { status: 204 });
  }),

  /** Очистка корзины пачкой: неизвестные id игнорируются — операция идемпотентна. */
  http.post(apiRoute(API_ROUTES.trash.purge), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = purgeTrashPayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите элементы корзины");
    }

    purgeMockNodes(parsed.data.ids);

    return new HttpResponse(null, { status: 204 });
  }),
];
