import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";
import { getTrashItem, moveToTrash } from "../../test/trash";

import { RestoreNodeButton } from "./ui/restore-node-button";

beforeEach(async () => {
  await signInAsDemo();
});

describe("RestoreNodeButton", () => {
  it("возвращает файл в хранилище и сообщает об успехе", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<RestoreNodeButton item={getTrashItem(SEED_IDS.resume)} />);

    await user.click(screen.getByRole("button", { name: "Восстановить" }));

    expect(await screen.findByText("Восстановлено: «Резюме.pdf»")).toBeInTheDocument();
    expect(getDb().files.some((file) => file.id === SEED_IDS.resume)).toBe(true);
    expect(getDb().trash).toHaveLength(0);
  });

  it("возвращает папку вместе с поддеревом", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.folders.byId(SEED_IDS.documents));

    renderWithProviders(<RestoreNodeButton item={getTrashItem(SEED_IDS.documents)} />);

    await user.click(screen.getByRole("button", { name: "Восстановить" }));

    await waitFor(() =>
      expect(getDb().folders.some((folder) => folder.id === SEED_IDS.documents)).toBe(true),
    );
    expect(getDb().files.some((file) => file.id === SEED_IDS.estimate)).toBe(true);
    expect(getDb().trash).toHaveLength(0);
  });

  it("показывает ошибку восстановления тостом", async () => {
    const user = userEvent.setup();

    await moveToTrash(API_ROUTES.files.byId(SEED_IDS.resume));

    renderWithProviders(<RestoreNodeButton item={getTrashItem(SEED_IDS.resume)} />);

    // Второй файл с тем же именем делает восстановление конфликтом 409.
    await fetch(`${window.location.origin}${API_BASE_PATH}${API_ROUTES.files.uploadInit}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Резюме.pdf",
        folderId: null,
        size: 10,
        mimeType: "application/pdf",
      }),
    });

    await user.click(screen.getByRole("button", { name: "Восстановить" }));

    expect(await screen.findByText("Объект с таким именем уже существует")).toBeInTheDocument();
    expect(getDb().trash).toHaveLength(1);
  });
});
