import { mergeConfig } from "vitest/config";

import { reactConfig } from "@cs/config/vitest/react.config.mjs";

/**
 * Пороги чуть ниже фактического покрытия (на старте F10: 94.46 / 88.46 / 92.04 / 94.51).
 * Задача порогов — ловить падение, а не требовать сто процентов: `views` и `app`
 * вынесены из `coverage.include` и проверяются E2E-набором.
 */
export default mergeConfig(reactConfig, {
  test: {
    coverage: {
      thresholds: {
        statements: 93,
        branches: 87,
        functions: 91,
        lines: 93,
      },
    },
  },
});
