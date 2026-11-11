import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { mergeConfig } from "vitest/config";

import { baseConfig } from "./base.config.mjs";

/** jsdom + React-плагин + алиасы из tsconfig. */
export const reactConfig = mergeConfig(baseConfig, {
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**"],
    css: false,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.d.ts",
        "src/test/**",
        "src/**/mocks/**",
        "src/app/**",
        "src/views/**",
      ],
    },
  },
});
