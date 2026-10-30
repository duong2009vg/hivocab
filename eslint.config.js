import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "data/**",
      "scratch/**",
      "public/data/**",
      "src/styles/themes.css",
    ],
  },
  js.configs.recommended,
  {
    files: [
      "src/**/*.{js,jsx}",
      "functions/**/*.js",
      "workers/**/*.js",
      "scripts/**/*.{js,mjs}",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Existing UI modules intentionally contain guarded legacy callbacks.
      // Keep these visible during the migration without blocking every build.
      "no-empty": "warn",
      "no-extra-boolean-cast": "warn",
      "no-useless-escape": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "off",
    },
  },
];
