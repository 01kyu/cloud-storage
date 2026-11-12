"use client";

import { useEffect, useState } from "react";

/**
 * Значение «догоняет» вход через `delayMs`: запрос уходит не на каждый символ,
 * а после паузы в наборе.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
};
