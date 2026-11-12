import { mergeConfig } from "vitest/config";

import { reactConfig } from "@cs/config/vitest/react.config.mjs";

/**
 * Пороги чуть ниже фактического покрытия (после F10/B: 94.61 / 88.57 / 92.62 / 94.71).
 * Задача порогов — ловить падение, а не требовать сто процентов: `views` и `app`
 * вынесены из `coverage.include` и проверяются E2E-набором.
 */
export default mergeConfig(reactConfig, {
  test: {
    coverage: {
      thresholds: {
        statements: 94,
        branches: 88,
        functions: 92,
        lines: 94,
      },
    },
  },
});
