import { expect, test, type Page } from "@playwright/test";

import { dragHandle, listItem, login, openNodeMenu } from "./support/session";

const UPLOAD_NAMES = ["e2e-отчёт.txt", "e2e-заметки.txt", "e2e-список.txt"];
const FOLDER_NAME = "E2E папка";
const SOURCE_FILE = "Скриншот.png";
const ARCHIVE_FILE = "Бэкап-2025.zip";
const RENAMED_FILE = "Скриншот 2.png";
const COPY_FILE = "Скриншот (копия).png";

/** Файлы для dropzone: `DataTransfer` с настоящими `File` — как при переносе из ОС. */
const filesTransfer = (page: Page) =>
  page.evaluateHandle((names: string[]) => {
    const transfer = new DataTransfer();

    names.forEach((name) => {
      transfer.items.add(new File([new Uint8Array(2_000_000)], name, { type: "text/plain" }));
    });

    return transfer;
  }, UPLOAD_NAMES);

const openFolder = async (page: Page, name: string): Promise<void> => {
  await listItem(page, name).getByRole("link").click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
};

test.describe("файлы", { tag: "@files" }, () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** E2E №2: три файла через dropzone — очередь завершается, листинг и квота обновляются. */
  test("загрузка трёх файлов через dropzone", async ({ page }) => {
    const quota = page.getByRole("region", { name: "Использование хранилища" });
    const quotaBefore = await quota.innerText();
    const dropzone = page.getByRole("group", { name: "Область загрузки файлов" });
    const dataTransfer = await filesTransfer(page);

    await dropzone.dispatchEvent("dragenter", { dataTransfer });
    await expect(page.getByText("Отпустите файлы, чтобы загрузить")).toBeVisible();

    await dropzone.dispatchEvent("drop", { dataTransfer });

    const queue = page.getByRole("region", { name: "Очередь загрузки" });

    await expect(queue.getByText("Готово")).toHaveCount(UPLOAD_NAMES.length, { timeout: 20_000 });

    for (const name of UPLOAD_NAMES) {
      await expect(listItem(page, name)).toBeVisible();
    }

    await expect(quota).not.toHaveText(quotaBefore);
  });

  /** E2E №9: режим и сортировка переносятся ссылкой. */
  test("сохраняет режим и сортировку в URL", async ({ page }) => {
    await page.getByRole("radio", { name: "Сетка" }).click();
    await expect(page).toHaveURL(/\?view=grid$/);

    await page.getByRole("button", { name: "Сортировка: Имя" }).click();
    await page.getByRole("menuitemradio", { name: "Размер" }).click();

    // `:` в query кодируется браузером как `%3A` — принимаем оба варианта.
    await expect(page).toHaveURL(/view=grid&sort=size(%3A|:)asc/);

    await page.reload();
    await expect(page.locator("[data-view='grid']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Сортировка: Размер" })).toBeVisible();
  });

  /** E2E №8: копия файла создаётся рядом с оригиналом через меню строки. */
  test("копирует файл через меню строки", async ({ page }) => {
    await openNodeMenu(page, SOURCE_FILE);
    await page.getByRole("menuitem", { name: "Копировать" }).click();

    await expect(listItem(page, COPY_FILE)).toBeVisible();
    // Тост объявляется ещё и в `aria-live`-регионе, поэтому берём точное совпадение.
    await expect(page.getByText(`Создана копия «${COPY_FILE}»`, { exact: true })).toBeVisible();
  });

  /** E2E №3: папка → перенос → переименование → удаление → корзина → восстановление. */
  test("папка, перенос, переименование, корзина и восстановление", async ({ page }) => {
    await page.getByRole("button", { name: "Создать папку" }).click();

    const createDialog = page.getByRole("dialog", { name: "Новая папка" });

    await createDialog.getByLabel("Название").fill(FOLDER_NAME);
    await createDialog.getByRole("button", { name: "Создать" }).click();
    await expect(listItem(page, FOLDER_NAME)).toBeVisible();

    const transfer = await page.evaluateHandle(() => new DataTransfer());
    const source = dragHandle(page, SOURCE_FILE);
    const target = dragHandle(page, FOLDER_NAME);

    await source.dispatchEvent("dragstart", { dataTransfer: transfer });
    await target.dispatchEvent("dragover", { dataTransfer: transfer });
    await target.dispatchEvent("drop", { dataTransfer: transfer });

    await openFolder(page, FOLDER_NAME);
    await expect(listItem(page, SOURCE_FILE)).toBeVisible();

    await openNodeMenu(page, SOURCE_FILE);
    await page.getByRole("menuitem", { name: "Переименовать" }).click();

    const renameDialog = page.getByRole("dialog", { name: "Переименовать" });

    await renameDialog.getByLabel("Название").fill(RENAMED_FILE);
    await renameDialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(listItem(page, RENAMED_FILE)).toBeVisible();

    await openNodeMenu(page, RENAMED_FILE);
    await page.getByRole("menuitem", { name: "Удалить" }).click();
    await page
      .getByRole("dialog", { name: "Удалить файл?" })
      .getByRole("button", { name: "Удалить" })
      .click();

    await expect(listItem(page, RENAMED_FILE)).toHaveCount(0);

    await page.goto("/trash");
    await expect(page.getByRole("heading", { name: "Корзина" })).toBeVisible();

    const trashRow = page
      .getByRole("region", { name: "Корзина" })
      .getByRole("listitem")
      .filter({ hasText: RENAMED_FILE });

    await expect(trashRow).toBeVisible();
    await trashRow.getByRole("button", { name: "Восстановить" }).click();
    await expect(trashRow).toHaveCount(0);

    await page.goto("/files");
    await openFolder(page, FOLDER_NAME);

    await expect(listItem(page, RENAMED_FILE)).toBeVisible();
  });

  /** E2E №10: выделение в корзине работает пачкой, а не только по одной строке. */
  test("восстанавливает выбранные файлы из корзины", async ({ page }) => {
    for (const name of [SOURCE_FILE, ARCHIVE_FILE]) {
      await openNodeMenu(page, name);
      await page.getByRole("menuitem", { name: "Удалить" }).click();
      await page
        .getByRole("dialog", { name: "Удалить файл?" })
        .getByRole("button", { name: "Удалить" })
        .click();

      await expect(listItem(page, name)).toHaveCount(0);
    }

    await page.goto("/trash");

    const trash = page.getByRole("region", { name: "Корзина" });

    await expect(page.getByRole("heading", { name: "Корзина" })).toBeVisible();
    await expect(trash.getByRole("listitem")).toHaveCount(2);

    await trash.getByRole("checkbox", { name: "Выбрать все" }).click();
    await expect(trash.getByText("Выбрано: 2")).toBeVisible();

    await trash.getByRole("button", { name: "Восстановить (2)" }).click();
    await expect(trash.getByText("Корзина пуста")).toBeVisible();

    await page.goto("/files");
    await expect(listItem(page, SOURCE_FILE)).toBeVisible();
    await expect(listItem(page, ARCHIVE_FILE)).toBeVisible();
  });
});
