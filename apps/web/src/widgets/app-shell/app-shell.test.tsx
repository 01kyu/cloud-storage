import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEMO_USER } from "@cs/shared";

import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { AppShell } from "./app-shell";

beforeEach(async () => {
  await signInAsDemo();
});

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("AppShell", () => {
  it("рендерит навигацию, дерево папок и пользователя из мока", async () => {
    renderWithProviders(
      <AppShell>
        <p>Контент</p>
      </AppShell>,
    );

    const nav = screen.getByRole("navigation", { name: "Основная навигация" });

    expect(within(nav).getAllByRole("link")).toHaveLength(4);
    expect(within(nav).getByRole("link", { name: "Файлы" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    expect(screen.getByText("Контент")).toBeInTheDocument();
    expect(await screen.findByRole("treeitem", { name: "Документы" })).toHaveAttribute(
      "href",
      "/files/f0000000-0000-4000-8000-000000000001",
    );
    expect(await screen.findByText("Демо Пользователь")).toBeInTheDocument();
    expect(await screen.findByText(DEMO_USER.email)).toBeInTheDocument();
  });

  it("переключает тему кнопкой в футере", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AppShell>
        <p>Контент</p>
      </AppShell>,
    );

    const toggle = await screen.findByRole("button", { name: "Включить тёмную тему" });

    await user.click(toggle);

    expect(
      await screen.findByRole("button", { name: "Включить светлую тему" }),
    ).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("открывает палитру поиска кнопкой в сайдбаре", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AppShell>
        <p>Контент</p>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Поиск" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.type(screen.getByRole("combobox", { name: "Поиск по имени" }), "рез");

    expect(await screen.findByRole("option", { name: /Резюме\.pdf/ })).toBeInTheDocument();
  });

  it("открывает палитру поиска по Ctrl+K и закрывает по Esc", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AppShell>
        <p>Контент</p>
      </AppShell>,
    );

    await user.keyboard("{Control>}k{/Control}");

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
