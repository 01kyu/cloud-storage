"use client";

import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore } from "@app/store";

type StoreProviderProps = {
  children: ReactNode;
};

/** Свой стор на каждое монтирование: иначе SSR-кэш делится между пользователями. */
export const StoreProvider = ({ children }: StoreProviderProps) => {
  const storeRef = useRef<AppStore | null>(null);

  storeRef.current ??= makeStore();

  return <Provider store={storeRef.current}>{children}</Provider>;
};
