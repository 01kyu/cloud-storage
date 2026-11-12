import { delay, http, HttpResponse } from "msw";

import { API_ROUTES, searchQuerySchema } from "@cs/shared";

import { getDb } from "../db";
import { mockLatency } from "../latency";
import { unauthorized, validationFailed } from "../response";
import { apiRoute } from "../route";
import { searchPage } from "../search-ops";

const guard = (): Response | null => (getDb().session ? null : unauthorized());

/** Параметры приходят строками — `searchQuerySchema` приводит `limit` и валидирует `q`. */
const readSearchQuery = (request: Request) =>
  searchQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));

export const searchHandlers = [
  http.get(apiRoute(API_ROUTES.search.query), async ({ request }) => {
    await delay(mockLatency());

    const denied = guard();

    if (denied) {
      return denied;
    }

    const parsed = readSearchQuery(request);

    if (!parsed.success) {
      return validationFailed("Укажите запрос не короче двух символов");
    }

    return HttpResponse.json(searchPage(parsed.data));
  }),
];
