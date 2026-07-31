import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * There's no type checker in this project, so ESLint is the second line of
 * defence. Accessibility rules are errors, not warnings — the spec treats a11y
 * as non-optional.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // eslint-config-next enables only six jsx-a11y rules; scope the strict rule
    // set to the same files so it merges with next's plugin registration.
    files: ["**/*.{js,jsx,mjs}"],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      "jsx-a11y/no-autofocus": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["app/lib/graphql/generated/**"],
    rules: { "no-unused-vars": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]),
]);

export default eslintConfig;
