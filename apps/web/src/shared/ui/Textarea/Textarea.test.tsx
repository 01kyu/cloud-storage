import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("рендерит многострочное поле и принимает ввод", async () => {
    const user = userEvent.setup();

    render(<Textarea aria-label="Описание" />);

    const textarea = screen.getByRole("textbox", { name: "Описание" });

    await user.type(textarea, "первая строка");

    expect(textarea).toHaveValue("первая строка");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("использует rows по умолчанию и принимает своё значение", () => {
    const { rerender } = render(<Textarea aria-label="Заметка" />);

    expect(screen.getByRole("textbox", { name: "Заметка" })).toHaveAttribute("rows", "4");

    rerender(<Textarea aria-label="Заметка" rows={8} />);

    expect(screen.getByRole("textbox", { name: "Заметка" })).toHaveAttribute("rows", "8");
  });

  it("выставляет aria-invalid при ошибке", () => {
    render(<Textarea aria-label="Комментарий" invalid />);

    expect(screen.getByRole("textbox", { name: "Комментарий" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
