import { expect, test, type Page } from "@playwright/test";

import { inheritMockDb } from "./support/mock-db";
import { login, openNodeMenu } from "./support/session";

const SHARED_FILE = "Скриншот.png";

/** Создаёт ссылку через меню строки и возвращает её абсолютный адрес. */
const createShareLink = async (
  page: Page,
  permission: "Просмотр" | "Скачивание",
): Promise<string> => {
  await openNodeMenu(page, SHARED_FILE);
  await page.getByRole("menuitem", { name: "Поделиться" }).click();

  const form = page.getByRole("dialog", { name: "Поделиться" });

  await form.getByRole("radio", { name: permission }).check();
  await form.getByRole("button", { name: "Создать ссылку" }).click();

  const ready = page.getByRole("dialog", { name: "Ссылка готова" });

  await expect(ready).toBeVisible();

  const url = await ready.getByLabel("Публичная ссылка").inputValue();

  await ready.getByRole("button", { name: "Готово" }).click();

  return url;
};

test.describe("публичные ссылки", { tag: "@shares" }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** E2E №5: ссылка открывается и скачивается в чистом контексте, без авторизации. */
  test("ссылка открывается и скачивается без авторизации", async ({ page, browser }) => {
    const shareUrl = await createShareLink(page, "Скачивание");

    expect(shareUrl).toContain("/s/");

    const guestContext = await browser.newContext();

    await inheritMockDb(page, guestContext);

    const guestPage = await guestContext.newPage();

    await guestPage.goto(shareUrl);

    await expect(guestPage.getByRole("heading", { name: SHARED_FILE })).toBeVisible();
    await expect(guestPage.getByRole("button", { name: "Выйти" })).toHaveCount(0);

    const downloadPromise = guestPage.waitForEvent("download");

    await guestPage.getByRole("button", { name: "Скачать" }).click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(SHARED_FILE);

    await guestContext.close();
  });

  test("отозванная ссылка больше не открывается", async ({ page, browser }) => {
    const shareUrl = await createShareLink(page, "Просмотр");

    await page.goto("/shared");
    await expect(page.getByRole("heading", { name: "Общий доступ" })).toBeVisible();

    const row = page
      .getByRole("region", { name: "Общий доступ" })
      .getByRole("listitem")
      .filter({ hasText: SHARED_FILE });

    await row.getByRole("button", { name: `Отозвать ссылку на ${SHARED_FILE}` }).click();
    await expect(row).toHaveCount(0);

    const guestContext = await browser.newContext();

    await inheritMockDb(page, guestContext);

    const guestPage = await guestContext.newPage();

    await guestPage.goto(shareUrl);
    await expect(guestPage.getByText("Ссылка не найдена")).toBeVisible();

    await guestContext.close();
  });
});
