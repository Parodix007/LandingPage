import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // public/demo/**/*.js = verbatim third-party-style mockup assets (support.js,
    // image-slot.js) copied in as-is — never linted or refactored (SPEC demo section).
    "public/**",
  ]),
]);

export default eslintConfig;
