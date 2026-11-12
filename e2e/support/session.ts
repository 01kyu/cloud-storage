import { expect, type Page } from "@playwright/test";

import { DEMO_USER } from "../../packages/shared/src/index";

/**
 * E2E живёт вне воркспейсов, поэтому алиаса `@cs/shared` здесь нет:
 * контракт подключается относительным путём, чтобы демо-доступ не дублировался.
 */

/** Вход демо-пользователем: мок принимает только эти данные. */
export const login = async (page: Page): Promise<void> => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await page.getByLabel("Email").fill(DEMO_USER.email);
  await page.getByLabel("Пароль").fill(DEMO_USER.password);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page).toHaveURL(/\/files$/);
  await expect(page.getByRole("heading", { name: "Все файлы" })).toBeVisible();
};

/** Строка листинга: у файла и папки одна разметка списка. */
export const listItem = (page: Page, name: string) =>
  page.locator("[data-view='list'] li").filter({ hasText: name });

/** Элемент с `draggable`: он же источник и цель переноса (`useNodeDnd`). */
export const dragHandle = (page: Page, name: string) =>
  listItem(page, name).locator("[draggable='true']");

/** Меню действий строки: контекстное меню недоступно с клавиатуры, «⋮» доступно. */
export const openNodeMenu = async (page: Page, name: string): Promise<void> => {
  await page.getByRole("button", { name: `Действия: ${name}` }).click();
};
