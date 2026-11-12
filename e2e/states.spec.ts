import { expect, test } from "@playwright/test";

import { listItem, login } from "./support/session";

/** E2E №6: пустая папка, недоступная папка и 404 публичной ссылки. */
test.describe("состояния", { tag: "@states" }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("пустая папка показывает подсказку", async ({ page }) => {
    await listItem(page, "Пустая папка").getByRole("link").click();

    await expect(page.getByRole("heading", { name: "Пустая папка" })).toBeVisible();
    await expect(page.getByText("В папке пусто")).toBeVisible();
  });

  test("неизвестная папка показывает состояние ошибки с повтором", async ({ page }) => {
    await page.goto("/files/00000000-0000-4000-8000-000000000000");

    await expect(page.getByText("Не удалось загрузить папку")).toBeVisible();
    await expect(page.getByRole("button", { name: "Повторить" })).toBeVisible();
  });

  test("несуществующая публичная ссылка показывает 404-состояние", async ({ page }) => {
    await page.goto("/s/unknown-token-0123456789");

    await expect(page.getByText("Ссылка не найдена")).toBeVisible();
  });
});
