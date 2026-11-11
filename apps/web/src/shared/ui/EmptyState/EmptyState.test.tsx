import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("показывает заголовок и описание", () => {
    render(<EmptyState title="Папка пуста" description="Загрузите первый файл" />);

    expect(screen.getByText("Папка пуста")).toBeInTheDocument();
    expect(screen.getByText("Загрузите первый файл")).toBeInTheDocument();
  });

  it("скрывает декоративную иконку от скринридеров", () => {
    render(<EmptyState icon={<span data-testid="icon">∞</span>} title="Нет файлов" />);

    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("рендерит действие и прокидвает className", () => {
    const { container } = render(
      <EmptyState title="Ошибка загрузки" action={<Button>Повторить</Button>} className="custom" />,
    );

    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("custom");
  });

  it("не рендерит пустые секции", () => {
    const { container } = render(<EmptyState title="Пусто" />);

    expect(container.querySelectorAll("p")).toHaveLength(1);
  });
});
