import { expect, test } from "@playwright/test";

import { seedRootFiles } from "./support/mock-db";
import { listItem, login } from "./support/session";

/** Больше `LIMITS.pageSize` (50): иначе догрузка не появится. */
const SEEDED_FILES = 60;
const LAST_FILE = `Файл ${String(SEEDED_FILES).padStart(2, "0")}.txt`;

/** E2E №7: догрузка листинга и выдачи поиска, когда элементов больше страницы. */
test.describe("пагинация", { tag: "@pagination" }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await seedRootFiles(page, SEEDED_FILES);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Все файлы" })).toBeVisible();
  });

  test("догружает остаток листинга по кнопке", async ({ page }) => {
    const loadMore = page.getByRole("button", { name: "Показать ещё" });

    await expect(page.getByRole("status")).toHaveText("Показано 50");
    await expect(loadMore).toBeVisible();
    await expect(listItem(page, LAST_FILE)).toHaveCount(0);

    await loadMore.click();

    await expect(listItem(page, LAST_FILE)).toBeVisible();
    await expect(loadMore).toHaveCount(0);
  });

  test("догружает выдачу поиска в палитре", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const palette = page.getByRole("dialog", { name: "Поиск" });
    const input = palette.getByRole("combobox", { name: "Поиск по имени" });
    const options = palette.getByRole("listbox", { name: "Результаты поиска" }).getByRole("option");

    await input.fill("Файл");
    await expect(options).toHaveCount(50);

    await palette.getByRole("button", { name: "Показать ещё" }).click();

    await expect(options).toHaveCount(SEEDED_FILES);
  });
});
