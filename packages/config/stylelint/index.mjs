/** @type {import("stylelint").Config} */
const stylelintConfig = {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["stylelint-order"],
  rules: {
    "at-rule-no-unknown": null,
    "scss/at-rule-no-unknown": true,
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "scss/dollar-variable-pattern": null,
    "scss/dollar-variable-empty-line-before": null,
    "scss/percent-placeholder-pattern": null,
    "declaration-empty-line-before": null,
    "scss/at-use-no-redundant-alias": null,
    "scss/no-global-function-names": null,
  },
};

export default stylelintConfig;
