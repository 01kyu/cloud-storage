import { defineConfig } from "vitest/config";

/** Общие настройки тестов: node-окружение, покрытие, исключения. */
export const baseConfig = defineConfig({
  test: {
    globals: false,
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    include: ["src/**/*.{test,spec}.{ts,tsx,mts}", "test/**/*.{test,spec}.{ts,tsx,mts}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx,mts}",
        "src/**/*.d.ts",
        "src/**/index.ts",
        "src/test/**",
        "src/**/mocks/**",
      ],
    },
  },
});
