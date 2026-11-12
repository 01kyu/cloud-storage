import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";
import { getTrashItem, moveToTrash } from "../../test/trash";

import { PurgeAllButton } from "./ui/purge-all-button";
import { PurgeNodeButton } from "./ui/purge-node-button";

beforeEach(async () => {
  await signInAsDemo();
});

describe("PurgeNodeButton", () => {
  it("удаляет файл навсегда и освобождает квоту после подтверждения", async () => {
    const user = userEvent.setup();
    const usedBefore = getDb().user.storageUsed;

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<PurgeNodeButton item={getTrashItem(SEED_IDS.resume)} />);

    await user.click(screen.getByRole("button", { name: "Удалить навсегда" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("«Резюме.pdf» будет удалён");

    await user.click(screen.getByRole("button", { name: "Удалить" }));

    expect(await screen.findByText("Удалено навсегда: «Резюме.pdf»")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(0);
    expect(getDb().user.storageUsed).toBeLessThan(usedBefore);
    expect(getDb().trash.find((item) => item.id === SEED_IDS.resume)).toBeUndefined();
  });

  it("не удаляет по кнопке «Отмена»", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<PurgeNodeButton item={getTrashItem(SEED_IDS.resume)} />);

    await user.click(screen.getByRole("button", { name: "Удалить навсегда" }));
    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(getDb().trash).toHaveLength(1);
  });

  it("показывает ошибку удаления тостом", async () => {
    server.use(
      http.delete(`${API_BASE_PATH}${API_ROUTES.trash.byId(":nodeId")}`, () =>
        HttpResponse.json(
          { statusCode: 500, code: "INTERNAL", message: "Сервис недоступен" },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<PurgeNodeButton item={getTrashItem(SEED_IDS.resume)} />);

    await user.click(screen.getByRole("button", { name: "Удалить навсегда" }));
    await user.click(screen.getByRole("button", { name: "Удалить" }));

    expect(await screen.findByText("Сервис недоступен")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(1);
  });
});

describe("PurgeAllButton", () => {
  it("удаляет все элементы корзины", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));
    await moveToTrash(API_ROUTES.folders.byId(SEED_IDS.documents));

    const items = getDb().trash;

    expect(items.length).toBeGreaterThan(1);

    renderWithProviders(<PurgeAllButton items={items} />);

    await user.click(screen.getByRole("button", { name: "Очистить корзину" }));
    await user.click(screen.getByRole("button", { name: "Очистить" }));

    expect(await screen.findByText("Корзина очищена")).toBeInTheDocument();
    await waitFor(() => expect(getDb().trash).toHaveLength(0));
  });

  it("блокируется на пустой корзине", () => {
    renderWithProviders(<PurgeAllButton items={[]} />);

    expect(screen.getByRole("button", { name: "Очистить корзину" })).toBeDisabled();
  });

  it("показывает ошибку очистки тостом", async () => {
    server.use(
      http.post(`${API_BASE_PATH}${API_ROUTES.trash.purge}`, () =>
        HttpResponse.json(
          { statusCode: 500, code: "INTERNAL", message: "Сервис недоступен" },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<PurgeAllButton items={getDb().trash} />);

    await user.click(screen.getByRole("button", { name: "Очистить корзину" }));
    await user.click(screen.getByRole("button", { name: "Очистить" }));

    expect(await screen.findByText("Сервис недоступен")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(1);
  });
});
