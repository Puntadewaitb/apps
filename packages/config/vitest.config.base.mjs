import { defineConfig } from "vitest/config";

/** Config Vitest bersama. Gunakan: export default createVitestConfig({ ...override }) */
export function createVitestConfig(overrides = {}) {
  return defineConfig({
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
