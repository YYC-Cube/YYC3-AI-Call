import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "ui/**",
      "theme-provider.tsx",
      "smart-call-system.tsx",
      "use-mobile.tsx",
      "use-toast.ts",
      "docs/**",
      "scripts/**",
      "k8s/**",
      "nginx/**",
      "docker/**",
      "examples/**",
      "monitoring/**",
      "tests/performance/**",
      "public/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
