import { defineConfig } from "vitest/config";

/** Config Vitest bersama. Gunakan: export default createVitestConfig({ ...override }) */
export function createVitestConfig(overrides = {}) {
  return defineConfig({
    // Vite 8 (oxc): JSX otomatis, tsconfig `jsx: preserve` (untuk Next) diabaikan
    oxc: { jsx: { runtime: "automatic" } },
    test: {
      environment: "node",
      include: ["**/*.{test,spec}.{ts,tsx}"],
      exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**", "**/dist/**"],
      passWithNoTests: true,
      ...overrides,
    },
  });
}

export default createVitestConfig();
