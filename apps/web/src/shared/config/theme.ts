export const THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEMES)[number];

export type ResolvedTheme = Exclude<Theme, "system">;

export const THEME_STORAGE_KEY = "cloud-storage-theme";

const DEFAULT_THEME: Theme = "system";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const isTheme = (value: unknown): value is Theme =>
  typeof value === "string" && (THEMES as readonly string[]).includes(value);

/** Тема из localStorage; вне браузера и при ошибке доступа — «system». */
export const readTheme = (): Theme => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const writeTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Приватный режим или запрет storage — тема просто не сохранится.
  }
};

export const prefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(DARK_QUERY).matches;

export const resolveTheme = (theme: Theme): ResolvedTheme =>
  theme === "system" ? (prefersDark() ? "dark" : "light") : theme;

export const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = resolveTheme(theme);
};

/** Модуль без React-хуков: его можно импортировать из серверного `layout.tsx`. */
export const getThemeInitScript = (): string =>
  [
    "(function(){try{",
    `var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});`,
    `var d=window.matchMedia(${JSON.stringify(DARK_QUERY)}).matches?'dark':'light';`,
    "document.documentElement.dataset.theme=s==='dark'||s==='light'?s:d;",
    "}catch(e){}})();",
  ].join("");
