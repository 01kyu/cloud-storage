import { delay, http, HttpResponse } from "msw";

import { API_ROUTES } from "@cs/shared";

import { mockLatency } from "../latency";
import { apiRoute } from "../route";

export const healthHandlers = [
  http.get(apiRoute(API_ROUTES.health), async () => {
    await delay(mockLatency());

    return HttpResponse.json({ status: "ok" });
  }),
];
