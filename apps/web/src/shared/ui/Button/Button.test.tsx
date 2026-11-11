import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("рендерит текстовую метку и по умолчанию type=button", () => {
    render(<Button>Сохранить</Button>);

    const button = screen.getByRole("button", { name: "Сохранить" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
  });

  it("вызывает onClick по клику и по Enter с клавиатуры", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Открыть</Button>);

    const button = screen.getByRole("button", { name: "Открыть" });

    await user.click(button);
    button.focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("в режиме загрузки блокируется и сообщает aria-busy", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Загрузка
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Загрузка" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("прокидывает type=submit и aria-атрибуты", () => {
    render(
      <Button type="submit" aria-label="Отправить форму">
        →
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Отправить форму" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});
