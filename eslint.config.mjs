import { baseConfig, sharedIgnores, testsConfig } from "@cs/config/eslint/index.mjs";

/**
 * E2E и конфиг Playwright живут в корне, вне воркспейсов, поэтому линтуются
 * отдельным прогоном: `playwright.config.ts` и `e2e/**`.
 */
export default [
  { ignores: [...sharedIgnores, "apps/**", "packages/**", "e2e/support/**/*.d.ts"] },
  ...baseConfig,
  ...testsConfig,
];
