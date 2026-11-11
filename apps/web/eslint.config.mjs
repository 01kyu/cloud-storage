import { baseConfig, fsdBoundaries, reactConfig, testsConfig } from "@cs/config/eslint/index.mjs";

export default [...baseConfig, ...reactConfig, ...fsdBoundaries, ...testsConfig];
