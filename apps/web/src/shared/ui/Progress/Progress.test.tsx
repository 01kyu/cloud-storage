import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "./Progress";

describe("Progress", () => {
  it("отдаёт значение и максимум в ARIA", () => {
    render(<Progress value={40} max={200} aria-label="Загрузка файла" />);

    const progress = screen.getByRole("progressbar", { name: "Загрузка файла" });

    expect(progress).toHaveAttribute("aria-valuenow", "40");
    expect(progress).toHaveAttribute("aria-valuemax", "200");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
  });

  it("переводит значение в проценты индикатора", () => {
    const { container } = render(<Progress value={25} aria-label="Прогресс" />);
    const indicator = container.firstElementChild?.firstElementChild;

    expect(indicator).toHaveStyle({ transform: "translateX(-75%)" });
  });

  it("зажимает значения вне диапазона", () => {
    const { container, rerender } = render(<Progress value={-10} aria-label="Прогресс" />);

    expect(container.firstElementChild?.firstElementChild).toHaveStyle({
      transform: "translateX(-100%)",
    });

    rerender(<Progress value={150} aria-label="Прогресс" />);

    expect(container.firstElementChild?.firstElementChild).toHaveStyle({
      transform: "translateX(-0%)",
    });
  });
});
