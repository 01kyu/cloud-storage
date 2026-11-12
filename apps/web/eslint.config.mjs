import {
  baseConfig,
  fsdBoundaries,
  reactConfig,
  testsConfig,
  typeCheckedConfig,
} from "@cs/config/eslint/index.mjs";

export default [
  ...baseConfig,
  ...reactConfig,
  ...typeCheckedConfig,
  ...fsdBoundaries,
  ...testsConfig,
];
