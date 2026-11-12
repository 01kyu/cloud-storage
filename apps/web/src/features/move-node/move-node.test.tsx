import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_PATH, API_ROUTES, NodeType, type Node } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { NODE_DRAG_MIME, useNodeDnd } from "./model/use-node-dnd";
import { MoveNodeDialog } from "./ui/move-node-dialog";

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

  renderWithProviders(<MoveNodeDialog node={node} onOpenChange={onOpenChange} />);

  return { onOpenChange };
};

/** Минимальный потребитель хука: проверяем перенос без разметки виджета. */
const DropTarget = ({ node }: { node: Node }) => {
  const { dragProps, dropProps, isOver } = useNodeDnd(node);

  return (
    <div data-testid="target" data-over={isOver || undefined} {...dragProps} {...dropProps}>
      {node.name}
    </div>
  );
};

beforeEach(async () => {
  await signInAsDemo();
});

describe("MoveNodeDialog", () => {
  it("показывает дерево папок и блокирует перенос в текущую папку", async () => {
    renderDialog(fileNode(SEED_IDS.resume));

    expect(await screen.findByRole("treeitem", { name: "Все файлы" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "Документы" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Переместить" })).toBeDisabled();
  });

  it("переносит файл в выбранную папку", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(fileNode(SEED_IDS.resume));

    await user.click(await screen.findByRole("treeitem", { name: "Отчёты" }));

    const submit = screen.getByRole("button", { name: "Переместить" });

    expect(submit).toBeEnabled();

    await user.click(submit);

    await waitFor(() =>
      expect(getDb().files.find((file) => file.id === SEED_IDS.resume)?.folderId).toBe(
        SEED_IDS.reports,
      ),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("исключает саму папку и её поддерево из целей", async () => {
    renderDialog(folderNode(SEED_IDS.documents));

    expect(await screen.findByRole("treeitem", { name: "Музыка" })).toBeInTheDocument();
    expect(screen.queryByRole("treeitem", { name: "Документы" })).not.toBeInTheDocument();
    expect(screen.queryByRole("treeitem", { name: "Отчёты" })).not.toBeInTheDocument();
  });

  it("показывает ошибку переноса тостом и оставляет диалог открытым", async () => {
    server.use(
      http.post(`${API_BASE_PATH}${API_ROUTES.files.move(":fileId")}`, () =>
        HttpResponse.json(
          { statusCode: 409, code: "CONFLICT", message: "В папке уже есть файл с таким именем" },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    const { onOpenChange } = renderDialog(fileNode(SEED_IDS.resume));

    await user.click(await screen.findByRole("treeitem", { name: "Отчёты" }));
    await user.click(screen.getByRole("button", { name: "Переместить" }));

    expect(await screen.findByText("В папке уже есть файл с таким именем")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("useNodeDnd", () => {
  it("кладёт в dataTransfer id и тип узла", () => {
    renderWithProviders(<DropTarget node={fileNode(SEED_IDS.resume)} />);

    const setData = vi.fn();

    fireEvent.dragStart(screen.getByTestId("target"), {
      dataTransfer: { setData, effectAllowed: "" },
    });

    expect(setData).toHaveBeenCalledWith(
      NODE_DRAG_MIME,
      JSON.stringify({ id: SEED_IDS.resume, type: NodeType.File }),
    );
  });

  it("переносит файл в папку по drop", async () => {
    renderWithProviders(<DropTarget node={folderNode(SEED_IDS.documents)} />);

    const dataTransfer = {
      types: [NODE_DRAG_MIME],
      dropEffect: "",
      getData: () => JSON.stringify({ id: SEED_IDS.resume, type: NodeType.File }),
    };

    fireEvent.drop(screen.getByTestId("target"), { dataTransfer });

    await waitFor(() =>
      expect(getDb().files.find((file) => file.id === SEED_IDS.resume)?.folderId).toBe(
        SEED_IDS.documents,
      ),
    );
  });

  it("переносит папку и подсвечивает цель", () => {
    renderWithProviders(<DropTarget node={folderNode(SEED_IDS.emptyFolder)} />);

    const dataTransfer = {
      types: [NODE_DRAG_MIME],
      dropEffect: "",
      getData: () => JSON.stringify({ id: SEED_IDS.music, type: NodeType.Folder }),
    };

    fireEvent.dragOver(screen.getByTestId("target"), { dataTransfer });

    expect(screen.getByTestId("target")).toHaveAttribute("data-over", "true");

    fireEvent.drop(screen.getByTestId("target"), { dataTransfer });

    expect(screen.getByTestId("target")).not.toHaveAttribute("data-over");
  });
});
