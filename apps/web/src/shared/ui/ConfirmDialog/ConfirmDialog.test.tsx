import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("показывает заголовок и описание, когда открыт", async () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Удалить файл?"
        description="Файл переместится в корзину"
        onConfirm={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveAccessibleName("Удалить файл?");
    expect(dialog).toHaveAccessibleDescription("Файл переместится в корзину");
    expect(screen.getByRole("button", { name: "Подтвердить" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("вызывает onConfirm при подтверждении", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Очистить корзину?"
        confirmLabel="Очистить"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Очистить" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("закрывается по кнопке отмены", async () => {
    const user = userEvent.setup();

    const Controlled = () => {
      const [open, setOpen] = useState(true);

      return (
        <ConfirmDialog open={open} onOpenChange={setOpen} title="Удалить?" onConfirm={vi.fn()} />
      );
    };

    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("блокирует подтверждение во время загрузки", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog open onOpenChange={vi.fn()} title="Удалить?" loading onConfirm={onConfirm} />,
    );

    const confirm = screen.getByRole("button", { name: "Подтвердить" });

    expect(confirm).toBeDisabled();

    await user.click(confirm);

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
