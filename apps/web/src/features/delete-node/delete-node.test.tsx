import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_PATH, API_ROUTES, type Node } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { DeleteNodeDialog } from "./ui/delete-node-dialog";

const fileNode = (id: string): Node => {
  const file = getDb().files.find((item) => item.id === id);

  if (!file) {
    throw new Error(`Файл ${id} не найден в моке`);
  }

  return file;
};

const folderNode = (id: string): Node => {
  const folder = getDb().folders.find((item) => item.id === id);

  if (!folder) {
    throw new Error(`Папка ${id} не найдена в моке`);
  }

  return folder;
};

const renderDialog = (node: Node) => {
  const onOpenChange = vi.fn();

  renderWithProviders(<DeleteNodeDialog node={node} onOpenChange={onOpenChange} />);

  return { onOpenChange };
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("DeleteNodeDialog", () => {
  it("убирает файл в корзину", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(fileNode(SEED_IDS.resume));

    expect(screen.getByRole("dialog")).toHaveTextContent("Удалить файл?");
    expect(screen.getByRole("dialog")).toHaveTextContent("«Резюме.pdf» попадёт в корзину");

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() =>
      expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(false),
    );
    expect(getDb().trash.some((item) => item.id === SEED_IDS.resume)).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("убирает папку вместе с поддеревом", async () => {
    const user = userEvent.setup();
    renderDialog(folderNode(SEED_IDS.documents));

    expect(screen.getByRole("dialog")).toHaveTextContent("Удалить папку?");

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    await waitFor(() =>
      expect(getDb().folders.some((folder) => folder.id === SEED_IDS.documents)).toBe(false),
    );
    expect(getDb().trash.some((item) => item.id === SEED_IDS.summary)).toBe(true);
  });

  it("не удаляет по кнопке «Отмена»", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(fileNode(SEED_IDS.resume));

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(true);
  });

  it("показывает ошибку сервера и оставляет файл на месте", async () => {
    server.use(
      http.delete(`${API_BASE_PATH}${API_ROUTES.files.byId(":fileId")}`, () =>
        HttpResponse.json(
          { statusCode: 500, code: "INTERNAL", message: "Сервис недоступен" },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(fileNode(SEED_IDS.resume));

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Сервис недоступен");
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("показывает запасную ошибку при сетевом сбое", async () => {
    server.use(
      http.delete(`${API_BASE_PATH}${API_ROUTES.files.byId(":fileId")}`, () =>
        HttpResponse.error(),
      ),
    );

    const user = userEvent.setup();
    renderDialog(fileNode(SEED_IDS.resume));

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    // `baseQuery` ретраит `FETCH_ERROR` (ожидание старта MSW), поэтому ждём дольше.
    expect(await screen.findByRole("alert", undefined, { timeout: 3000 })).toHaveTextContent(
      "Не удалось удалить. Попробуйте ещё раз",
    );
  });
});
