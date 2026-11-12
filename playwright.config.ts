import { defineConfig, devices } from "@playwright/test";

/**
 * Порт по умолчанию 3000; `E2E_PORT` нужен, когда локальный dev-сервер уже занял его.
 * `baseURL` и `webServer` смотрят в одно место.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Замедление шагов для наглядного прогона: `set E2E_SLOW_MO=800&& npm run test:e2e:headed`.
 * В CLI-флаге такого нет, поэтому значение читается из окружения.
 */
const SLOW_MO = Number(process.env.E2E_SLOW_MO ?? 0);

/**
 * E2E гоняется по production-сборке: dev-компиляция страниц по требованию
 * даёт плавающие таймауты на первом переходе.
 *
 * Моки включаются на этапе сборки: `NEXT_PUBLIC_API_MOCKING` инлайнится в бандл,
 * поэтому переменная нужна и `next build`, и `next start`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: SLOW_MO > 0 ? { slowMo: SLOW_MO } : {} },
    },
  ],
  webServer: {
    command: `npm run build --workspace @cs/web && npm run start --workspace @cs/web -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_API_URL: "/api/v1",
      NEXT_PUBLIC_API_MOCKING: "on",
    },
  },
});
