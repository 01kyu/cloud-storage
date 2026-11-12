import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { API_ROUTES } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";
import { moveToTrash } from "../../test/trash";

import { TrashExplorer } from "./trash-explorer";

beforeEach(async () => {
  await signInAsDemo();
});

describe("TrashExplorer", () => {
  it("показывает пустое состояние и блокирует очистку", async () => {
    renderWithProviders(<TrashExplorer />);

    expect(await screen.findByText("Корзина пуста")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Очистить корзину" })).toBeDisabled();
  });

  it("показывает удалённый файл с размером и датой", async () => {
    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<TrashExplorer />);

    expect(await screen.findByText("Резюме.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Файл · /)).toBeInTheDocument();
    expect(screen.getByText(/Удалён /)).toBeInTheDocument();
  });

  it("восстанавливает файл и убирает его из списка", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<TrashExplorer />);

    await user.click(await screen.findByRole("button", { name: "Восстановить" }));

    expect(await screen.findByText("Восстановлено: «Резюме.pdf»")).toBeInTheDocument();
    expect(await screen.findByText("Корзина пуста")).toBeInTheDocument();
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(true);
  });

  it("удаляет элемент навсегда после подтверждения", async () => {
    const user = userEvent.setup();
    const usedBefore = getDb().user.storageUsed;

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<TrashExplorer />);

    await user.click(await screen.findByRole("button", { name: "Удалить навсегда" }));
    await user.click(screen.getByRole("button", { name: "Удалить" }));

    expect(await screen.findByText("Удалено навсегда: «Резюме.pdf»")).toBeInTheDocument();
    expect(await screen.findByText("Корзина пуста")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(0);
    expect(getDb().user.storageUsed).toBeLessThan(usedBefore);
  });

  it("очищает корзину целиком", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));
    await moveToTrash(API_ROUTES.folders.byId(SEED_IDS.documents));

    renderWithProviders(<TrashExplorer />);

    expect(await screen.findByText("Резюме.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Очистить корзину" }));
    await user.click(screen.getByRole("button", { name: "Очистить" }));

    expect(await screen.findByText("Корзина очищена")).toBeInTheDocument();
    expect(await screen.findByText("Корзина пуста")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(0);
  });

  it("помечает шапку indeterminate при частичном выборе", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));
    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.notes));

    renderWithProviders(<TrashExplorer />);

    await user.click(await screen.findByRole("checkbox", { name: "Выбрать «Резюме.pdf»" }));

    expect(screen.getByText("Выбрано: 1")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Выбрать все" })).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  });

  it("восстанавливает выбранные объекты пачкой", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));
    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.notes));

    renderWithProviders(<TrashExplorer />);

    await user.click(await screen.findByRole("checkbox", { name: "Выбрать все" }));

    expect(screen.getByRole("checkbox", { name: "Выбрать все" })).toHaveAttribute(
      "data-state",
      "checked",
    );

    await user.click(screen.getByRole("button", { name: "Восстановить (2)" }));

    expect(await screen.findByText("Восстановлено объектов: 2")).toBeInTheDocument();
    expect(await screen.findByText("Корзина пуста")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(0);
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(true);
    expect(getDb().files.some((file) => file.id === SEED_IDS.notes)).toBe(true);
  });

  it("удаляет только выбранные объекты навсегда", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));
    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.notes));

    renderWithProviders(<TrashExplorer />);

    await user.click(await screen.findByRole("checkbox", { name: "Выбрать «Резюме.pdf»" }));
    await user.click(screen.getByRole("button", { name: "Удалить (1)" }));
    await user.click(screen.getByRole("button", { name: "Удалить" }));

    expect(await screen.findByText("Удалено навсегда объектов: 1")).toBeInTheDocument();
    expect(await screen.findByText("Заметки.txt")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Резюме.pdf")).not.toBeInTheDocument();
    });
    // Выделение сбрасывается после действия: тулбар возвращается к «Выбрать все».
    expect(screen.getByText("Выбрать все")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Выбрать «Заметки.txt»" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
    expect(getDb().trash.map((item) => item.id)).toEqual([SEED_IDS.notes]);
  });
});
