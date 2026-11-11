import { getThemeInitScript } from "@shared/config";

/** Применяет тему до гидрации — иначе тёмная тема мигает светлым. */
export const ThemeScript = () => (
  <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
);
