import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "./base-query";
import { TAG_TYPES } from "./tags";

/** Эндпоинты добавляются из `entities/*`, поэтому слой `shared` не зависит от верхних. */
export const rootApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
