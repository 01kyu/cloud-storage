import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";

import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

describe("Popover", () => {
  it("открывается по клику на триггер", async () => {
    const user = userEvent.setup();

    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Фильтры</Button>
        </PopoverTrigger>
        <PopoverContent>Панель фильтров</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Панель фильтров")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Фильтры" }));

    expect(await screen.findByText("Панель фильтров")).toBeInTheDocument();
  });

  it("закрывается по Escape", async () => {
    const user = userEvent.setup();

    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Фильтры</Button>
        </PopoverTrigger>
        <PopoverContent>Панель фильтров</PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Фильтры" }));
    await screen.findByText("Панель фильтров");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByText("Панель фильтров")).not.toBeInTheDocument());
  });
});
