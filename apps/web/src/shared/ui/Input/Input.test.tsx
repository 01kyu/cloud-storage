import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  it("принимает ввод и отдаёт значение в onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Input placeholder="Почта" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Почта"), "demo");

    expect(screen.getByPlaceholderText("Почта")).toHaveValue("demo");
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it("помечает ошибку через aria-invalid", () => {
    render(<Input aria-label="Название папки" invalid />);

    expect(screen.getByRole("textbox", { name: "Название папки" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("прокидывает ref на DOM-элемент", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} aria-label="Поиск" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("не вводит текст, когда disabled", async () => {
    const user = userEvent.setup();

    render(<Input aria-label="Логин" disabled />);

    const input = screen.getByRole("textbox", { name: "Логин" });

    await user.type(input, "text");

    expect(input).toBeDisabled();
    expect(input).toHaveValue("");
  });
});
