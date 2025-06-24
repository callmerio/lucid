import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URL: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        Event: "readonly",
        DOMRect: "readonly",
        HTMLElement: "readonly",
        Location: "readonly",
        WebSocket: "readonly",
        CustomEvent: "readonly",
        MutationObserver: "readonly",

        // DOM types
        Node: "readonly",
        Element: "readonly",
        HTMLElement: "readonly",
        Text: "readonly",
        Range: "readonly",
        NodeFilter: "readonly",
        DocumentFragment: "readonly",
        ShadowRoot: "readonly",
        KeyboardEvent: "readonly",
        DOMException: "readonly",

        // WebExtension globals
        browser: "readonly",
        chrome: "readonly",
        defineBackground: "readonly",
        defineContentScript: "readonly",

        // Node.js globals (for config files)
        global: "readonly",
        self: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // TypeScript 推荐规则
      ...typescript.configs.recommended.rules,

      // React 推荐规则
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 相关规则
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off", // 使用 TypeScript 进行类型检查

      // TypeScript 相关规则
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // 通用规则
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-unused-expressions": "error",
      "no-duplicate-imports": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ignores: [
      "dist/**",
      ".output/**",
      ".wxt/**",
      "node_modules/**",
      "dev/**",
      "*.config.js",
      "*.config.ts",
      ".husky/**",
    ],
  },
];
