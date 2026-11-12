import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import {
  API_BASE_PATH,
  API_ROUTES,
  NodeType,
  SharePermission,
  shareSchema,
  type Share,
} from "@cs/shared";
import { SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { SharesExplorer } from "./shares-explorer";

const createShare = async (nodeId: string, nodeType: NodeType): Promise<Share> => {
  const response = await fetch(
    `${window.location.origin}${API_BASE_PATH}${API_ROUTES.shares.create}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId, nodeType, permission: SharePermission.Download }),
    },
  );

  return shareSchema.parse(await response.json());
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("SharesExplorer", () => {
  it("показывает пустое состояние", async () => {
    renderWithProviders(<SharesExplorer />);

    expect(await screen.findByText("Публичных ссылок нет")).toBeInTheDocument();
  });

  it("перечисляет ссылки и ведёт на публичную страницу", async () => {
    const share = await createShare(SEED_IDS.summary, NodeType.File);

    renderWithProviders(<SharesExplorer />);

    expect(await screen.findByText("Итоги года.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Файл · просмотр и скачивание/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть ссылку на Итоги года.pdf" })).toHaveAttribute(
      "href",
      `/s/${share.token}`,
    );
  });

  it("показывает ссылку на папку", async () => {
    await createShare(SEED_IDS.documents, NodeType.Folder);

    renderWithProviders(<SharesExplorer />);

    expect(await screen.findByText("Документы")).toBeInTheDocument();
    expect(screen.getByText(/Папка · просмотр и скачивание/)).toBeInTheDocument();
  });

  it("отзывает ссылку и убирает строку", async () => {
    const user = userEvent.setup();

    await createShare(SEED_IDS.summary, NodeType.File);

    renderWithProviders(<SharesExplorer />);
    await screen.findByText("Итоги года.pdf");

    await user.click(screen.getByRole("button", { name: "Отозвать ссылку на Итоги года.pdf" }));

    expect(await screen.findByText("Ссылка на «Итоги года.pdf» отозвана")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Итоги года.pdf")).not.toBeInTheDocument());
    expect(await screen.findByText("Публичных ссылок нет")).toBeInTheDocument();
  });

  it("сообщает об ошибке отзыва и оставляет строку", async () => {
    const user = userEvent.setup();

    await createShare(SEED_IDS.summary, NodeType.File);

    renderWithProviders(<SharesExplorer />);
    await screen.findByText("Итоги года.pdf");

    server.use(
      http.delete(
        `${window.location.origin}${API_BASE_PATH}${API_ROUTES.shares.byId(":shareId")}`,
        () =>
          HttpResponse.json(
            { statusCode: 500, code: "INTERNAL", message: "Сервер недоступен" },
            { status: 500 },
          ),
      ),
    );

    await user.click(screen.getByRole("button", { name: "Отозвать ссылку на Итоги года.pdf" }));

    expect(await screen.findByText("Сервер недоступен")).toBeInTheDocument();
    expect(screen.getByText("Итоги года.pdf")).toBeInTheDocument();
  });

  it("показывает ошибку загрузки и повторяет запрос", async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${window.location.origin}${API_BASE_PATH}${API_ROUTES.shares.list}`, () =>
        HttpResponse.json(
          { statusCode: 500, code: "INTERNAL", message: "Сервер недоступен" },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<SharesExplorer />);

    expect(await screen.findByText("Не удалось загрузить ссылки")).toBeInTheDocument();

    server.resetHandlers();

    await user.click(screen.getByRole("button", { name: "Повторить" }));

    expect(await screen.findByText("Публичных ссылок нет")).toBeInTheDocument();
  });
});
