import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";

export const testsConfig = [
  {
    files: [
      "**/*.{test,spec}.{ts,tsx}",
      "**/*.int-spec.ts",
      "**/test/**/*.{ts,tsx}",
      "**/e2e/**/*.ts",
    ],
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
];
