import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Temporarily allow any types for v1.0.0 release
      "@typescript-eslint/no-explicit-any": "off",
      // Allow empty object types for UI components
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow require imports for config files
      "@typescript-eslint/no-require-imports": "off",
      // Make React hooks exhaustive deps a warning instead of error
      "react-hooks/exhaustive-deps": "warn",
    },
  }
);
