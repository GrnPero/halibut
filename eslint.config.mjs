import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const DECLARATIONS = ["const", "let", "var"];

const SINGLE_LINE_DECLARATIONS = [
  "singleline-const",
  "singleline-let",
  "singleline-var",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Blank lines between steps so a human can scan the code. Prettier keeps
  // blank lines but never adds them; `npx eslint --fix` does.
  {
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        // A blank line before every return.
        { blankLine: "always", prev: "*", next: "return" },
        // A blank line after declarations; a run of one-line ones can stay together.
        { blankLine: "always", prev: DECLARATIONS, next: "*" },
        {
          blankLine: "any",
          prev: SINGLE_LINE_DECLARATIONS,
          next: SINGLE_LINE_DECLARATIONS,
        },
        // A blank line before and after any braced block (if, for, try, …).
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
        // Also after a braceless if, like a one-line guard clause.
        { blankLine: "always", prev: "if", next: "*" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
