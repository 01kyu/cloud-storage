import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  DEMO_USER,
  NodeType,
  SharePermission,
  shareSchema,
} from "@cs/shared";
import { SEED_IDS } from "@shared/api/mocks";
import { ApiRequestError } from "@shared/lib";

import { fetchPublicShareBlob } from "./fetch-public-share";

const apiOrigin = window.location.origin;

/** Логин через настоящий хендлер: тест лежит глубже, чем позволяет импорт `src/test`. */
const signIn = async (): Promise<void> => {
  await fetch(`${apiOrigin}${API_BASE_PATH}${API_ROUTES.auth.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEMO_USER),
  });
};

const createToken = async (password?: string): Promise<string> => {
  const response = await fetch(`${apiOrigin}${API_BASE_PATH}${API_ROUTES.shares.create}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Download,
      ...(password ? { password } : {}),
    }),
  });

  return shareSchema.parse(await response.json()).token;
};

const download = (token: string, password?: string): Promise<Blob> =>
  fetchPublicShareBlob({ token, ...(password ? { password } : {}) });

beforeEach(async () => {
  await signIn();
});

describe("fetchPublicShareBlob", () => {
  it("скачивает тело файла по токену", async () => {
    const token = await createToken();

    expect((await download(token)).size).toBeGreaterThan(0);
  });

  it("передаёт пароль: без него ответ 401 превращается в ошибку контракта", async () => {
    const token = await createToken("1234");
    const locked = await download(token).catch((error: unknown) => error);

    expect(locked).toBeInstanceOf(ApiRequestError);
    expect((await download(token, "1234")).size).toBeGreaterThan(0);
  });

  it("отдаёт ошибку для неизвестного токена", async () => {
    const error = await download("unknown-token-123").catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).data).toMatchObject({ code: "NOT_FOUND" });
  });
});
