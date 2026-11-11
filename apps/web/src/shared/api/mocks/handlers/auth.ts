import { delay, http, HttpResponse } from "msw";

import { ApiErrorCode, API_ROUTES, loginPayloadSchema } from "@cs/shared";

import { MOCK_SESSION_TOKEN } from "../constants";
import { getDb, publicUser, saveDb } from "../db";
import { mockLatency } from "../latency";
import { jsonError, unauthorized, validationFailed } from "../response";
import { apiRoute } from "../route";

/** Сессия мока живёт в `db.session`: service worker не может выставить `httpOnly`-cookie. */
export const authHandlers = [
  http.post(apiRoute(API_ROUTES.auth.login), async ({ request }) => {
    await delay(mockLatency());

    const parsed = loginPayloadSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return validationFailed("Укажите корректный email и пароль");
    }

    const db = getDb();

    if (parsed.data.email !== db.user.email || parsed.data.password !== db.user.password) {
      return jsonError(401, ApiErrorCode.Unauthorized, "Неверный email или пароль");
    }

    db.session = { token: MOCK_SESSION_TOKEN };
    saveDb();

    return HttpResponse.json({ user: publicUser(db.user), accessToken: MOCK_SESSION_TOKEN });
  }),

  http.post(apiRoute(API_ROUTES.auth.logout), async () => {
    await delay(mockLatency());

    const db = getDb();

    db.session = null;
    saveDb();

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(apiRoute(API_ROUTES.auth.me), async () => {
    await delay(mockLatency());

    const db = getDb();

    return db.session ? HttpResponse.json(publicUser(db.user)) : unauthorized();
  }),
];
