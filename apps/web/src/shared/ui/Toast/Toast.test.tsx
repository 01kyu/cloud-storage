import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "./Toast";
import {
  dismissToast,
  getToastsSnapshot,
  resetToasts,
  showErrorToast,
  showSuccessToast,
  showToast,
} from "./toast-store";
import { Toaster } from "./toaster";

const renderToast = () => {
  const Controlled = () => {
    const [open, setOpen] = useState(true);

    return (
      <ToastProvider swipeDirection="right" duration={Infinity}>
        <ToastRoot open={open} onOpenChange={setOpen} tone="success">
          <ToastTitle>Файл загружен</ToastTitle>
          <ToastDescription>report.pdf готов к скачиванию</ToastDescription>
          <ToastClose />
        </ToastRoot>
        <ToastViewport />
      </ToastProvider>
    );
  };

  return render(<Controlled />);
};

describe("Toast", () => {
  it("показывает заголовок и описание уведомления", async () => {
    renderToast();

    expect(await screen.findByText("Файл загружен")).toBeInTheDocument();
    expect(screen.getByText("report.pdf готов к скачиванию")).toBeInTheDocument();
  });

  it("закрывается кнопкой", async () => {
    const user = userEvent.setup();

    renderToast();

    await user.click(await screen.findByRole("button", { name: "Закрыть" }));

    await waitFor(() => expect(screen.queryByText("Файл загружен")).not.toBeInTheDocument());
  });
});

describe("Toaster", () => {
  const renderToaster = () =>
    render(
      <ToastProvider duration={Infinity}>
        <Toaster />
      </ToastProvider>,
    );

  it("рендерит добавленный тост из очереди", async () => {
    renderToaster();

    showToast({ title: "Черновик сохранён", description: "Файл готов к загрузке" });

    expect(await screen.findByText("Черновик сохранён")).toBeInTheDocument();
    expect(screen.getByText("Файл готов к загрузке")).toBeInTheDocument();
  });

  it("объявляет тост скринридеру через role=status", async () => {
    renderToaster();

    showErrorToast("Не удалось создать папку");

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Не удалось создать папку"),
    );
  });

  it("показывает несколько тостов и закрывает их по кнопке", async () => {
    const user = userEvent.setup();

    renderToaster();

    showSuccessToast("Файл восстановлен");
    showErrorToast("Не удалось удалить файл");

    expect(await screen.findByText("Файл восстановлен")).toBeInTheDocument();
    expect(screen.getByText("Не удалось удалить файл")).toBeInTheDocument();

    const [firstClose] = screen.getAllByRole("button", { name: "Закрыть" });

    await user.click(firstClose as HTMLElement);

    await waitFor(() => expect(screen.queryByText("Файл восстановлен")).not.toBeInTheDocument());
    expect(screen.getByText("Не удалось удалить файл")).toBeInTheDocument();
  });

  it("очищается через resetToasts и dismissToast", () => {
    renderToaster();

    const id = showToast({ title: "Временный тост" });

    expect(getToastsSnapshot()).toHaveLength(1);

    dismissToast(id);
    expect(getToastsSnapshot()).toHaveLength(0);

    showToast({ title: "Ещё один тост" });
    expect(getToastsSnapshot()).toHaveLength(1);

    resetToasts();
    expect(getToastsSnapshot()).toHaveLength(0);
  });
});
