import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../Button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";

const renderMenu = (onSelect = vi.fn()) =>
  render(
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Действия</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Файл</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onSelect}>Переименовать</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger">Удалить</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );

describe("DropdownMenu", () => {
  it("открывается по клику и показывает пункты", async () => {
    const user = userEvent.setup();

    renderMenu();

    await user.click(screen.getByRole("button", { name: "Действия" }));

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Переименовать" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Удалить" })).toBeInTheDocument();
  });

  it("вызывает onSelect у пункта", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderMenu(onSelect);

    await user.click(screen.getByRole("button", { name: "Действия" }));
    await user.click(await screen.findByRole("menuitem", { name: "Переименовать" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("поддерживает навигацию стрелками и закрывается по Escape", async () => {
    const user = userEvent.setup();

    renderMenu();

    await user.click(screen.getByRole("button", { name: "Действия" }));
    await screen.findByRole("menu");

    await user.keyboard("{ArrowDown}");

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Переименовать" })).toHaveAttribute(
        "data-highlighted",
      ),
    );

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
