import { expect, test } from "@playwright/test";

import { login } from "./support/session";

/** E2E №4: поиск по имени, фильтр по типу и переход по Enter. */
test.describe("поиск", { tag: "@search" }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("находит файл по имени и открывает его папку по Enter", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const palette = page.getByRole("dialog", { name: "Поиск" });

    await expect(palette).toBeVisible();

    const input = palette.getByRole("combobox", { name: "Поиск по имени" });
    const results = palette.getByRole("listbox", { name: "Результаты поиска" });

    await input.fill("Смета");
    await expect(results.getByRole("option", { name: /Смета\.xlsx/ })).toBeVisible();

    await input.press("Enter");

    // Файл открывается в своей папке с параметрами подсветки найденного объекта.
    await expect(page).toHaveURL(/\/files\/[0-9a-f-]{36}\?highlight=[0-9a-f-]{36}&q=/);
    await expect(page.getByRole("heading", { name: "Отчёты" })).toBeVisible();
    await expect(page.locator("mark")).toHaveText("Смета");
  });

  test("фильтр по типу оставляет только папки", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const palette = page.getByRole("dialog", { name: "Поиск" });
    const input = palette.getByRole("combobox", { name: "Поиск по имени" });
    const results = palette.getByRole("listbox", { name: "Результаты поиска" });

    await input.fill("Отчёт");
    await expect(results.getByRole("option", { name: /Отчёты/ })).toBeVisible();

    await palette.getByRole("button", { name: "Тип: Все" }).click();
    await page.getByRole("menuitemradio", { name: "Папки" }).click();

    await expect(palette.getByRole("button", { name: "Тип: Папки" })).toBeVisible();
    await expect(results.getByRole("option")).toHaveCount(1);
  });
});
