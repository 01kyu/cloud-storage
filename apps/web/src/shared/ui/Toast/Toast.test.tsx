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
