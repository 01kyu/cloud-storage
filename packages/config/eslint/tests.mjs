import testingLibrary from "eslint-plugin-testing-library";
import playwright from "eslint-plugin-playwright";
import vitest from "@vitest/eslint-plugin";

/** Vitest-правила не должны попадать в Playwright-спеки: у них свои матчеры. */
export const testsConfig = [
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "**/*.int-spec.ts", "**/test/**/*.{ts,tsx}"],
    ignores: ["**/e2e/**"],
    plugins: {
      vitest,
      "testing-library": testingLibrary,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs.react.rules,
      "testing-library/no-node-access": "off",
      "testing-library/no-container": "off",
      "testing-library/no-manual-cleanup": "off",
      "vitest/no-disabled-tests": "warn",
    },
  },
  {
    files: ["**/e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
    },
  },
];
