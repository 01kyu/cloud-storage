"use client";

import { useSyncExternalStore } from "react";

/** macOS/iOS: в подписях хоткеев `⌘` вместо `Ctrl`. */
export const isAppleUserAgent = (userAgent: string): boolean =>
  /Mac OS X|iPhone|iPad|iPod/.test(userAgent);

/** Подписка не нужна: платформа за сессию не меняется. */
const subscribe = (): (() => void) => () => {};

const getSnapshot = (): boolean => isAppleUserAgent(globalThis.navigator?.userAgent ?? "");

/**
 * SSR не знает User-Agent, поэтому сервер и первая гидрация отдают `false`
 * (как Windows): расхождение разметки исключено, а после гидрации подпись
 * хоткея перерисовывается под платформу.
 */
const getServerSnapshot = (): boolean => false;

export const useIsApplePlatform = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
