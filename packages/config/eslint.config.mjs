import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** ESLint flat config bersama (base TypeScript + Next). */
const config = defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@next/next/no-html-link-for-pages": "off" } }, // App Router: tidak ada pages/
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    // Keluaran build sample statis (scripts/demo/build.mjs): salinan app + hasil export, bukan kode sumber.
    "**/.demo/**",
    "**/dist-demo/**",
    "**/coverage/**",
    "**/generated/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "**/next-env.d.ts",
  ]),
]);

export default config;
