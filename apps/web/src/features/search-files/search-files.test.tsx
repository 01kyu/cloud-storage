import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { API_BASE_PATH, API_ROUTES } from "@cs/shared";
import { SEED_IDS } from "@shared/api/mocks";
import { ROUTES } from "@shared/config";

import { server } from "../../test/msw";
import { routerMock } from "../../test/navigation";
import { renderWithProviders } from "../../test/render-with-providers";
import { signInAsDemo } from "../../test/session";

import { useSearchHotkey } from "./model/use-search-hotkey";
import { SearchPalette } from "./ui/search-palette";

const PaletteHarness = () => {
  const [open, setOpen] = useState(true);

  return <SearchPalette open={open} onOpenChange={setOpen} />;
};

const HotkeyHarness = () => {
  const [open, setOpen] = useState(false);

  useSearchHotkey(() => setOpen(true));

  return <SearchPalette open={open} onOpenChange={setOpen} />;
};

const getCombobox = (): HTMLElement => screen.getByRole("combobox", { name: "Поиск по имени" });

beforeEach(async () => {
  await signInAsDemo();
});

describe("SearchPalette", () => {
  it("ищет по подстроке имени и подписывает результат", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "рез");

    expect(await screen.findByRole("option", { name: /Резюме\.pdf/ })).toBeInTheDocument();
    expect(screen.getByText("PDF · Документ")).toBeInTheDocument();
  });

  it("фильтрует выдачу по типу через меню", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "от");

    expect(await screen.findByRole("option", { name: /Отчёты/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Скриншот\.png/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Тип: Все" }));
    await user.click(await screen.findByRole("menuitemradio", { name: "Папки" }));

    // «от» есть и в «Отчёты», и в «Фотографии» — обе папки остаются, файлы уходят.
    await waitFor(() =>
      expect(screen.queryByRole("option", { name: /Скриншот\.png/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("option", { name: /Отчёты/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Фотографии/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Тип: Папки" })).toBeInTheDocument();
  });

  it("открывает активный результат по Enter", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "отч");
    await screen.findByRole("option", { name: /Отчёты/ });

    await user.keyboard("{Enter}");

    expect(routerMock.push).toHaveBeenCalledWith(ROUTES.folder(SEED_IDS.reports));
  });

  it("переводит фокус по стрелкам", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "от");
    await screen.findAllByRole("option");

    const firstActiveId = getCombobox().getAttribute("aria-activedescendant");

    expect(firstActiveId).not.toBeNull();

    await user.keyboard("{ArrowDown}");

    expect(getCombobox().getAttribute("aria-activedescendant")).not.toBe(firstActiveId);

    await user.keyboard("{ArrowUp}");

    expect(getCombobox()).toHaveAttribute("aria-activedescendant", firstActiveId ?? "");
  });

  it("просит ввести минимум два символа", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    expect(screen.getByText(/Введите минимум 2 символа/)).toBeInTheDocument();

    await user.type(getCombobox(), "р");

    expect(screen.getByText(/Введите минимум 2 символа/)).toBeInTheDocument();
  });

  it("сообщает, что ничего не найдено", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "ъъ");

    expect(
      await screen.findByText(/Ничего не найдено по запросу «ъъ»/, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("показывает ошибку поиска и повторяет запрос", async () => {
    const user = userEvent.setup();

    server.use(
      http.get(`${window.location.origin}${API_BASE_PATH}${API_ROUTES.search.query}`, () =>
        HttpResponse.json(
          { statusCode: 500, code: "INTERNAL_ERROR", message: "Сервер недоступен" },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "рез");

    expect(
      await screen.findByText(/Не удалось выполнить поиск/, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();

    server.resetHandlers();

    await user.click(screen.getByRole("button", { name: "Повторить" }));

    expect(await screen.findByRole("option", { name: /Резюме\.pdf/ })).toBeInTheDocument();
  });

  it("не отправляет запрос, пока он короче минимума", async () => {
    const user = userEvent.setup();

    renderWithProviders(<PaletteHarness />);

    await user.type(getCombobox(), "р");

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("открывается хоткеем Ctrl+K", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HotkeyHarness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.keyboard("{Control>}k{/Control}");

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
