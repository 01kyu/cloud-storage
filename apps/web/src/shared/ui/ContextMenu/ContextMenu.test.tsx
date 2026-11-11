import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ContextMenu";

const renderContextMenu = (onSelect = vi.fn()) =>
  render(
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>Файл отчёта.pdf</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onSelect}>Переименовать</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="danger">Удалить</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );

describe("ContextMenu", () => {
  it("открывается по правому клику", async () => {
    renderContextMenu();

    fireEvent.contextMenu(screen.getByText("Файл отчёта.pdf"), { button: 2 });

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Переименовать" })).toBeInTheDocument();
  });

  it("вызывает onSelect и закрывается после выбора", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderContextMenu(onSelect);

    fireEvent.contextMenu(screen.getByText("Файл отчёта.pdf"), { button: 2 });

    await user.click(await screen.findByRole("menuitem", { name: "Переименовать" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
