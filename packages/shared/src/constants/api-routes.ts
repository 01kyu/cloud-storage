export const API_BASE_PATH = "/api/v1";

export const API_ROUTES = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  folders: {
    create: "/folders",
    root: "/folders",
    /** Плоский список всех папок владельца — для построения дерева в сайдбаре. */
    tree: "/folders/tree",
    children: (folderId: string) => `/folders/${folderId}/children`,
    byId: (folderId: string) => `/folders/${folderId}`,
    breadcrumbs: (folderId: string) => `/folders/${folderId}/breadcrumbs`,
    move: (folderId: string) => `/folders/${folderId}/move`,
  },
  files: {
    uploadInit: "/files/upload/init",
    uploadComplete: "/files/upload/complete",
    /** Куда мок принимает тело файла. */
    mockUpload: (fileId: string) => `/mock-upload/${fileId}`,
    byId: (fileId: string) => `/files/${fileId}`,
    download: (fileId: string) => `/files/${fileId}/download`,
    move: (fileId: string) => `/files/${fileId}/move`,
    copy: (fileId: string) => `/files/${fileId}/copy`,
  },
  trash: {
    list: "/trash",
    restore: (nodeId: string) => `/trash/${nodeId}/restore`,
    purge: "/trash/purge",
    byId: (nodeId: string) => `/trash/${nodeId}`,
  },
  search: {
    query: "/search",
  },
  shares: {
    list: "/shares",
    create: "/shares",
    byId: (shareId: string) => `/shares/${shareId}`,
    public: (token: string) => `/public/shares/${token}`,
    publicDownload: (token: string) => `/public/shares/${token}/download`,
  },
  health: "/health",
} as const;
