import { http, HttpResponse } from "msw";

import { ApiErrorCode } from "@cs/shared";

import { apiRoute } from "../route";

import { authHandlers } from "./auth";
import { fileHandlers } from "./files";
import { folderHandlers } from "./folders";
import { healthHandlers } from "./health";

/** Всё, что не покрыто хендлерами, отвечает 404 по контракту `ApiError`. */
export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...folderHandlers,
  ...fileHandlers,

  http.all(`${apiRoute("")}/*`, ({ request }) =>
    HttpResponse.json(
      {
        statusCode: 404,
        code: ApiErrorCode.NotFound,
        message: `Мок для ${request.method} ${request.url} ещё не реализован`,
      },
      { status: 404 },
    ),
  ),
];
