import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("переключается кликом по метке", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Checkbox label="Показывать скрытые" onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByLabelText("Показывать скрытые"));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("переключается с клавиатуры пробелом", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Checkbox label="Согласен" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Согласен" });

    checkbox.focus();
    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("отдаёт состояние indeterminate как aria-checked=mixed", () => {
    render(<Checkbox label="Выбрать всё" checked="indeterminate" />);

    expect(screen.getByRole("checkbox", { name: "Выбрать всё" })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("не переключается, когда disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(<Checkbox label="Заблокировано" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Заблокировано" }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
