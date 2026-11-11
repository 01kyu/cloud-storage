import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

import { explorerReducer } from "@features/toggle-view";
import { uploadQueueReducer } from "@features/upload-files";
import { rootApi } from "@shared/api";

/**
 * Своя копия на сервер и на тест: иначе кэш RTK Query протекает между запросами.
 * Стор живёт в `app`, потому что собирает редьюсеры фич.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      [rootApi.reducerPath]: rootApi.reducer,
      explorer: explorerReducer,
      uploadQueue: uploadQueueReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(rootApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
