import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";

import { CopyShareLinkButton } from "./ui/copy-share-link-button";

const SHARE_URL = "http://localhost:3000/s/share-token-123";

/** jsdom не реализует Clipboard API — подменяем только эту границу браузера. */
const stubClipboard = (writeText: (text: string) => Promise<void>) => {
  const spy = vi.fn(writeText);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: { writeText: spy },
  });

  return spy;
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("CopyShareLinkButton", () => {
  it("копирует абсолютный адрес и подтверждает тостом", async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard(() => Promise.resolve());

    renderWithProviders(<CopyShareLinkButton url={SHARE_URL} />);

    await user.click(screen.getByRole("button", { name: "Копировать" }));

    expect(writeText).toHaveBeenCalledWith(SHARE_URL);
    expect(await screen.findByText("Ссылка скопирована")).toBeInTheDocument();
  });

  it("сообщает, если браузер запретил доступ к буферу", async () => {
    const user = userEvent.setup();

    stubClipboard(() => Promise.reject(new Error("denied")));

    renderWithProviders(<CopyShareLinkButton url={SHARE_URL} />);

    await user.click(screen.getByRole("button", { name: "Копировать" }));

    expect(await screen.findByText(/Не удалось скопировать ссылку/)).toBeInTheDocument();
  });
});
