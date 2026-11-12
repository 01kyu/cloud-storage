export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  files: "/files",
  folder: (folderId: string) => `/files/${folderId}`,
  /**
   * Переход из поиска: подсветить найденный объект (`highlight`) и совпадение
   * в его имени (`q`). Файл своего роута не имеет — открывается папка.
   */
  folderSearch: (folderId: string | null, nodeId: string, query: string) => {
    const params = new URLSearchParams({ highlight: nodeId });

    if (query.trim()) {
      params.set("q", query.trim());
    }

    return `${folderId ? `/files/${folderId}` : "/files"}?${params.toString()}`;
  },
  trash: "/trash",
  shared: "/shared",
  settings: "/settings",
  uiKit: "/ui-kit",
  publicShare: (token: string) => `/s/${token}`,
} as const;
