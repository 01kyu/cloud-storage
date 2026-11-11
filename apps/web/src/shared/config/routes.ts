export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  files: "/files",
  folder: (folderId: string) => `/files/${folderId}`,
  trash: "/trash",
  shared: "/shared",
  settings: "/settings",
  uiKit: "/ui-kit",
  publicShare: (token: string) => `/s/${token}`,
} as const;
