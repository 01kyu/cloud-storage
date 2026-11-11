import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "list", label: "Список" },
  { value: "grid", label: "Сетка" },
];

describe("SegmentedControl", () => {
  it("отдаёт выбранное значение", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SegmentedControl
        aria-label="Режим отображения"
        options={options}
        defaultValue="list"
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Сетка" }));

    expect(onValueChange).toHaveBeenCalledWith("grid");
  });

  it("помечает выбранный сегмент через data-state", () => {
    render(<SegmentedControl aria-label="Режим отображения" options={options} value="grid" />);

    expect(screen.getByRole("radio", { name: "Сетка" })).toHaveAttribute("data-state", "on");
    expect(screen.getByRole("radio", { name: "Список" })).toHaveAttribute("data-state", "off");
  });

  it("переключается стрелками и пробелом с клавиатуры", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SegmentedControl
        aria-label="Режим отображения"
        options={options}
        defaultValue="list"
        onValueChange={onValueChange}
      />,
    );

    screen.getByRole("radio", { name: "Список" }).focus();
    await user.keyboard("{ArrowRight}");

    const next = screen.getByRole("radio", { name: "Сетка" });

    expect(next).toHaveFocus();

    await user.keyboard(" ");

    expect(onValueChange).toHaveBeenCalledWith("grid");
  });
});
