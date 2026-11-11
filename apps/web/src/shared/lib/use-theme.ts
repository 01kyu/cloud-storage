"use client";

import { useCallback, useEffect, useState } from "react";

import { applyTheme, readTheme, writeTheme, type Theme } from "@shared/config";

export type { Theme };

type UseThemeResult = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

/** Стартовое значение одинаково на сервере и клиенте, иначе разметка расходится при гидрации. */
export const useTheme = (): UseThemeResult => {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = readTheme();

    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next);
    applyTheme(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
};
