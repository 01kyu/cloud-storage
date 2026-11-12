import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../Button";

import { Modal, ModalClose, ModalContent, ModalTrigger } from "./Modal";

const ModalExample = ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) => (
  <Modal onOpenChange={onOpenChange}>
    <ModalTrigger asChild>
      <Button>Открыть</Button>
    </ModalTrigger>
    <ModalContent
      title="Новая папка"
      description="Введите имя папки"
      footer={<Button>Создать</Button>}
    >
      <p>Содержимое</p>
    </ModalContent>
  </Modal>
);

describe("Modal", () => {
  it("открывается по триггеру и показывает заголовок и описание", async () => {
    const user = userEvent.setup();

    render(<ModalExample />);

    await user.click(screen.getByRole("button", { name: "Открыть" }));

    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveAccessibleName("Новая папка");
    expect(dialog).toHaveAccessibleDescription("Введите имя папки");
    expect(screen.getByText("Содержимое")).toBeInTheDocument();
  });

  it("фокусирует первое поле ввода при открытии", async () => {
    const user = userEvent.setup();

    render(
      <Modal>
        <ModalTrigger asChild>
          <Button>Открыть</Button>
        </ModalTrigger>
        <ModalContent title="Новая папка">
          <input aria-label="Название" />
          <Button>Создать</Button>
        </ModalContent>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Открыть" }));

    await screen.findByRole("dialog");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Название" })).toHaveFocus());
  });

  it("оставляет фокус обработчику, если он передан", async () => {
    const user = userEvent.setup();
    const onOpenAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      screen.getByRole("link", { name: "Ссылка" }).focus();
    });

    render(
      <Modal>
        <ModalTrigger asChild>
          <Button>Открыть</Button>
        </ModalTrigger>
        <ModalContent title="Новая папка" onOpenAutoFocus={onOpenAutoFocus}>
          <input aria-label="Название" />
          <a href="#target">Ссылка</a>
        </ModalContent>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Открыть" }));

    await screen.findByRole("dialog");
    expect(onOpenAutoFocus).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("link", { name: "Ссылка" })).toHaveFocus());
  });

  it("закрывается по Escape и возвращает фокус на триггер", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<ModalExample onOpenChange={onOpenChange} />);

    const trigger = screen.getByRole("button", { name: "Открыть" });

    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("закрывается кнопкой с крестиком", async () => {
    const user = userEvent.setup();

    render(<ModalExample />);

    await user.click(screen.getByRole("button", { name: "Открыть" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Закрыть" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("ModalClose внутри контента закрывает модалку", async () => {
    const user = userEvent.setup();

    const Controlled = () => {
      const [open, setOpen] = useState(true);

      return (
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent title="Подтверждение">
            <ModalClose asChild>
              <Button>Понятно</Button>
            </ModalClose>
          </ModalContent>
        </Modal>
      );
    };

    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Понятно" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
