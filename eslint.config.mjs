// AUTOVERSE TECH LAB — ESLint flat config（DL-003）
// 范围：packages/ 与 prototypes/ 的 TS 源码；文档、构建产物与 vendored 压缩文件排除。
import tseslint from "typescript-eslint";
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/public/**", // vendored 压缩文件（draco 解码器等）不 lint——F16 教训
      "**/node_modules/**",
      "docs/**",
      "reports/**",
      "assets/**",
      "**/*.md",
    ],
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
