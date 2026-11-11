import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";

import { Tooltip, TooltipProvider } from "./Tooltip";

const renderTooltip = () =>
  render(
    <TooltipProvider delayDuration={0}>
      <Tooltip content="Скачать файл" delayDuration={0}>
        <Button>Скачать</Button>
      </Tooltip>
    </TooltipProvider>,
  );

describe("Tooltip", () => {
  it("показывает подсказку при наведении", async () => {
    const user = userEvent.setup();

    renderTooltip();

    await user.hover(screen.getByRole("button", { name: "Скачать" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Скачать файл");
  });

  it("показывает подсказку при фокусе с клавиатуры", async () => {
    const user = userEvent.setup();

    renderTooltip();

    await user.tab();

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Скачать файл");
  });

  it("скрывается по Escape, сохраняя фокус на триггере", async () => {
    const user = userEvent.setup();

    renderTooltip();

    const trigger = screen.getByRole("button", { name: "Скачать" });

    await user.tab();
    await screen.findByRole("tooltip");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
