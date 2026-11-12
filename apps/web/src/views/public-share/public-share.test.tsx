import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_PATH, API_ROUTES, NodeType, SharePermission, shareSchema } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { PublicShareView } from "./public-share-view";

const apiOrigin = window.location.origin;

const createShare = async (body: Record<string, unknown>): Promise<string> => {
  const response = await fetch(`${apiOrigin}${API_BASE_PATH}${API_ROUTES.shares.create}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return shareSchema.parse(await response.json()).token;
};

/** Гость не входит в систему: сессию закрываем тем же API, что и кнопка «Выйти». */
const signOut = async (): Promise<void> => {
  await fetch(`${apiOrigin}${API_BASE_PATH}${API_ROUTES.auth.logout}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
};

const stubObjectUrl = () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:mock");

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  return createObjectURL;
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("PublicShareView", () => {
  it("открывается без сессии и показывает файл", async () => {
    const token = await createShare({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Download,
    });

    await signOut();

    renderWithProviders(<PublicShareView token={token} />);

    expect(await screen.findByRole("heading", { name: "Итоги года.pdf" })).toBeInTheDocument();
    expect(screen.getByText("Публичная ссылка")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Скачать" })).toBeInTheDocument();
  });

  it("скачивает файл по ссылке", async () => {
    const user = userEvent.setup();
    const createObjectURL = stubObjectUrl();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const token = await createShare({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Download,
    });

    await signOut();

    renderWithProviders(<PublicShareView token={token} />);
    await user.click(await screen.findByRole("button", { name: "Скачать" }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

    const blob = createObjectURL.mock.calls[0]?.[0];

    expect(blob?.size).toBeGreaterThan(0);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("просит пароль у защищённой ссылки", async () => {
    const user = userEvent.setup();
    const token = await createShare({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Download,
      password: "1234",
    });

    await signOut();

    renderWithProviders(<PublicShareView token={token} />);

    await user.type(await screen.findByLabelText("Пароль"), "1234");
    await user.click(screen.getByRole("button", { name: "Открыть" }));

    expect(await screen.findByRole("heading", { name: "Итоги года.pdf" })).toBeInTheDocument();
  });

  it("не показывает скачивание при праве просмотра", async () => {
    const token = await createShare({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Read,
    });

    await signOut();

    renderWithProviders(<PublicShareView token={token} />);

    expect(await screen.findByText("Ссылка разрешает только просмотр.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Скачать" })).not.toBeInTheDocument();
  });

  it("объясняет, что папку нельзя скачать", async () => {
    const token = await createShare({
      nodeId: SEED_IDS.documents,
      nodeType: NodeType.Folder,
      permission: SharePermission.Download,
    });

    await signOut();

    renderWithProviders(<PublicShareView token={token} />);

    expect(await screen.findByRole("heading", { name: "Документы" })).toBeInTheDocument();
    expect(screen.getByText(/Папку нельзя скачать по ссылке/)).toBeInTheDocument();
  });

  it("сообщает об отозванной и истёкшей ссылке", async () => {
    const token = await createShare({
      nodeId: SEED_IDS.summary,
      nodeType: NodeType.File,
      permission: SharePermission.Download,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    await signOut();

    const { unmount } = renderWithProviders(<PublicShareView token="unknown-token-123" />);

    expect(await screen.findByText("Ссылка не найдена")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Доступ по ссылке" })).toBeInTheDocument();

    unmount();

    const share = getDb().shares[0];

    if (!share) {
      throw new Error("Ссылка не попала в БД мока");
    }

    share.expiresAt = new Date(Date.now() - 60_000).toISOString();

    renderWithProviders(<PublicShareView token={token} />);

    expect(await screen.findByText("Срок действия ссылки истёк")).toBeInTheDocument();
  });
});
