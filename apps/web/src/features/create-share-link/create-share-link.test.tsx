import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_PATH, API_ROUTES, SharePermission, type Node } from "@cs/shared";
import { getDb, SEED_IDS } from "@shared/api/mocks";

import { server } from "../../test/msw";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { ShareNodeDialog } from "./ui/share-node-dialog";

const summaryNode = (): Node => {
  const file = getDb().files.find((item) => item.id === SEED_IDS.summary);

  if (!file) {
    throw new Error("Файл сидов не найден в моке");
  }

  return file;
};

const Harness = ({ node }: { node: Node }) => {
  const [open, setOpen] = useState(true);

  return <ShareNodeDialog node={open ? node : null} onOpenChange={setOpen} />;
};

const stubClipboard = () => {
  const writeText = vi.fn(() => Promise.resolve());

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: { writeText },
  });

  return writeText;
};

const shareUrlField = async (): Promise<HTMLInputElement> =>
  (await screen.findByRole("textbox", { name: "Публичная ссылка" })) as HTMLInputElement;

beforeEach(async () => {
  await signInAsDemo();
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("ShareNodeDialog", () => {
  it("создаёт бессрочную ссылку и показывает адрес", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Harness node={summaryNode()} />);

    await user.click(screen.getByRole("button", { name: "Создать ссылку" }));

    const field = await shareUrlField();

    expect(field.value).toContain("/s/");
    expect(field.value.startsWith("http")).toBe(true);
    expect(await screen.findByText("Ссылка готова")).toBeInTheDocument();

    const [share] = getDb().shares;

    expect(share).toMatchObject({
      nodeId: SEED_IDS.summary,
      permission: SharePermission.Read,
      hasPassword: false,
      expiresAt: null,
    });
    expect(field.value.endsWith(share?.token ?? "?")).toBe(true);
  });

  it("передаёт права, срок и пароль", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Harness node={summaryNode()} />);

    await user.click(screen.getByRole("radio", { name: "Скачивание" }));
    await user.click(screen.getByRole("radio", { name: "7 дней" }));
    await user.click(screen.getByRole("checkbox", { name: "Защитить паролем" }));
    await user.type(screen.getByLabelText(/Пароль/), "1234");
    await user.click(screen.getByRole("button", { name: "Создать ссылку" }));

    await shareUrlField();

    const [share] = getDb().shares;

    expect(share).toMatchObject({
      permission: SharePermission.Download,
      hasPassword: true,
      password: "1234",
    });
    expect(share?.expiresAt).not.toBeNull();
    expect(Date.parse(share?.expiresAt ?? "")).toBeGreaterThan(Date.now());
  });

  it("не отправляет запрос с коротким паролем", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Harness node={summaryNode()} />);

    await user.click(screen.getByRole("checkbox", { name: "Защитить паролем" }));
    await user.type(screen.getByLabelText(/Пароль/), "123");
    await user.click(screen.getByRole("button", { name: "Создать ссылку" }));

    expect(await screen.findByText("Пароль от 4 символов")).toBeInTheDocument();
    expect(getDb().shares).toHaveLength(0);
  });

  it("показывает ошибку сервера тостом и оставляет диалог открытым", async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${window.location.origin}${API_BASE_PATH}${API_ROUTES.shares.create}`, () =>
        HttpResponse.json(
          { statusCode: 500, code: "INTERNAL", message: "Сервер недоступен" },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<Harness node={summaryNode()} />);

    await user.click(screen.getByRole("button", { name: "Создать ссылку" }));

    expect(await screen.findByText("Сервер недоступен")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Создать ссылку" })).toBeInTheDocument();
    expect(getDb().shares).toHaveLength(0);
  });

  it("копирует готовую ссылку в буфер", async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard();

    renderWithProviders(<Harness node={summaryNode()} />);

    await user.click(screen.getByRole("button", { name: "Создать ссылку" }));

    const field = await shareUrlField();

    await user.click(screen.getByRole("button", { name: "Скопировать" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(field.value));
    expect(await screen.findByText("Ссылка скопирована")).toBeInTheDocument();
  });
});
