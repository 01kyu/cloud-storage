import { mergeConfig } from "vitest/config";

import { baseConfig } from "@cs/config/vitest/base.config.mjs";

/**
 * Контрактный пакет: схемы, енумы и роуты покрываются тестами целиком,
 * поэтому пороги держим максимально жёсткими (факт на старте F10: 100 / 90.9 / 100 / 100).
 */
export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      thresholds: {
        statements: 100,
        branches: 90,
        functions: 100,
        lines: 100,
      },
    },
  },
});
