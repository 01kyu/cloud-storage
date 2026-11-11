import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "../Input";

import { Field } from "./Field";

describe("Field", () => {
  it("связывает метку с контролом", () => {
    render(
      <Field label="Электронная почта">
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText("Электронная почта")).toBeInstanceOf(HTMLInputElement);
  });

  it("описывает контрол подсказкой", () => {
    render(
      <Field label="Имя папки" hint="До 64 символов">
        <Input />
      </Field>,
    );

    const input = screen.getByLabelText("Имя папки");
    const describedBy = input.getAttribute("aria-describedby");

    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent("До 64 символов");
  });

  it("показывает ошибку вместо подсказки и помечает контрол", () => {
    render(
      <Field label="Пароль" hint="Минимум 8 символов" error="Слишком короткий пароль">
        <Input />
      </Field>,
    );

    const input = screen.getByLabelText("Пароль");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Слишком короткий пароль");
    expect(screen.queryByText("Минимум 8 символов")).not.toBeInTheDocument();
  });

  it("выставляет aria-required и сохраняет id контрола", () => {
    render(
      <Field label="Почта" required>
        <Input id="email" />
      </Field>,
    );

    const input = screen.getByLabelText("Почта");

    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("aria-required", "true");
  });
});
