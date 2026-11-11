import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Node } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { RenameNodeDialog } from "./ui/rename-node-dialog";

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

  renderWithProviders(<RenameNodeDialog node={node} onOpenChange={onOpenChange} />);

  return { onOpenChange, input: screen.getByLabelText(/Название/) };
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("RenameNodeDialog", () => {
  it("подставляет текущее имя файла", () => {
    const { input } = renderDialog(fileNode(SEED_IDS.resume));

    expect(input).toHaveValue("Резюме.pdf");
  });

  it("переименовывает файл и закрывает диалог", async () => {
    const user = userEvent.setup();
    const { onOpenChange, input } = renderDialog(fileNode(SEED_IDS.resume));

    await user.clear(input);
    await user.type(input, "Резюме 2027.pdf");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(getDb().files.find((file) => file.id === SEED_IDS.resume)?.name).toBe(
        "Резюме 2027.pdf",
      ),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("переименовывает папку", async () => {
    const user = userEvent.setup();
    const { input } = renderDialog(folderNode(SEED_IDS.emptyFolder));

    await user.clear(input);
    await user.type(input, "Архив");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(getDb().folders.find((folder) => folder.id === SEED_IDS.emptyFolder)?.name).toBe(
        "Архив",
      ),
    );
  });

  it("показывает 409 для дубликата и не меняет имя", async () => {
    const user = userEvent.setup();
    const { onOpenChange, input } = renderDialog(fileNode(SEED_IDS.estimate));

    await user.clear(input);
    await user.type(input, "Итоги года.pdf");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Файл с таким именем уже существует",
    );
    expect(getDb().files.find((file) => file.id === SEED_IDS.estimate)?.name).toBe("Смета.xlsx");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("не отправляет пустое имя", async () => {
    const user = userEvent.setup();
    const { input } = renderDialog(fileNode(SEED_IDS.resume));

    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Введите имя")).toBeInTheDocument();
    expect(getDb().files.find((file) => file.id === SEED_IDS.resume)?.name).toBe("Резюме.pdf");
  });

  it("закрывается по кнопке «Отмена»", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(fileNode(SEED_IDS.resume));

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
