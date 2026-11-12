import { expect, test, type Page } from "@playwright/test";

import { login } from "./support/session";

/**
 * Проверки семантики без axe: ровно один `main` и один `h1` на страницу,
 * именованные landmark-и, `aria-current` у активного пункта навигации и
 * доступные имена диалогов. Полноценный аудит axe — отдельная задача (NOTES).
 */
const expectSingleLandmarks = async (page: Page): Promise<void> => {
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);
};

test.describe("a11y-семантика", { tag: "@a11y" }, () => {
  test("форма входа: один main и один h1", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1, name: "Вход" })).toBeVisible();
    await expectSingleLandmarks(page);
  });

  test("экраны хранилища: landmark-и и активный пункт навигации", async ({ page }) => {
    await login(page);

    const nav = page.getByRole("navigation", { name: "Основная навигация" });

    await expectSingleLandmarks(page);
    await expect(page.getByRole("heading", { level: 1, name: "Все файлы" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Файлы" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Корзина" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Корзина" })).toBeVisible();
    await expectSingleLandmarks(page);
    await expect(nav.getByRole("link", { name: "Корзина" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Файлы" })).not.toHaveAttribute("aria-current");

    await nav.getByRole("link", { name: "Общий доступ" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Общий доступ" })).toBeVisible();
    await expectSingleLandmarks(page);
    await expect(nav.getByRole("link", { name: "Общий доступ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("палитра поиска и модалка папки — диалоги с именем и фокусом внутри", async ({ page }) => {
    await login(page);

    await page.getByRole("button", { name: "Поиск" }).click();

    const palette = page.getByRole("dialog", { name: "Поиск" });

    await expect(palette).toBeVisible();
    await expect(palette.getByRole("combobox", { name: "Поиск по имени" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Создать папку" }).click();

    const dialog = page.getByRole("dialog", { name: "Новая папка" });

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Название" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("публичная ссылка без авторизации: один main и h1 даже на ошибке", async ({ page }) => {
    await page.goto("/s/unknown-token-123");

    await expect(page.getByRole("heading", { level: 1, name: "Доступ по ссылке" })).toBeVisible();
    await expect(page.getByText("Ссылка не найдена")).toBeVisible();
    await expectSingleLandmarks(page);
    await expect(page.getByRole("navigation")).toHaveCount(0);
  });
});
