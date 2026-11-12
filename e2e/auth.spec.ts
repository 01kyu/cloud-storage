import { expect, test } from "@playwright/test";

import { login } from "./support/session";

/** E2E №1: сессии нет — форма входа; вход ведёт в хранилище; logout возвращает на форму. */
test.describe("аутентификация", { tag: "@smoke" }, () => {
  test("без сессии уводит на форму входа, а logout завершает сессию", async ({ page }) => {
    await page.goto("/files");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

    await login(page);

    await expect(
      page
        .getByRole("navigation", { name: "Основная навигация" })
        .getByRole("link", { name: "Файлы" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Демо Пользователь")).toBeVisible();

    await page.getByRole("button", { name: "Выйти" }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/files");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  });
});
