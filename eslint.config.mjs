// AUTOVERSE TECH LAB — ESLint flat config（DL-003）
// 范围：packages/ 与 prototypes/ 的 TS 源码；文档与构建产物排除。
import tseslint from "typescript-eslint";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "docs/**", "reports/**", "assets/**", "**/*.md"],
  },
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
);
