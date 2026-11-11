import { setupServer } from "msw/node";

import { handlers } from "@shared/api/mocks";

/** MSW-сервер для jsdom-тестов: те же хендлеры, что и в браузере. */
export const server = setupServer(...handlers);
