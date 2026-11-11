import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Download } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("доступна по текстовой метке", () => {
    render(
      <IconButton label="Скачать файл">
        <Download />
      </IconButton>,
    );

    expect(screen.getByRole("button", { name: "Скачать файл" })).toBeEnabled();
  });

  it("вызывает обработчик по клику и Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <IconButton label="Удалить" onClick={onClick}>
        ×
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Удалить" });

    await user.click(button);
    button.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("сохраняет type=button и блокировку", () => {
    render(
      <IconButton label="Закрыть" disabled>
        ×
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Закрыть" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeDisabled();
  });
});
