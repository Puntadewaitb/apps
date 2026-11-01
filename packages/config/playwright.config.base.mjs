import { defineConfig } from "@playwright/test";

/**
 * Config Playwright bersama. Hanya project `chromium`.
 * PW_CHROMIUM_PATH di-set di cloud (/opt/pw-browsers/chromium); di CI dikosongkan.
 * webServer memakai build produksi pada port app.
 */
export function createPlaywrightConfig({
  port,
  testDir = "./e2e",
  /** Perintah pengganti untuk menyiapkan + menjalankan server (default: build + next start). */
  serverCommand,
  /** Env tambahan untuk proses server (mis. DATABASE_URL khusus tes). */
  serverEnv,
  ...overrides
}) {
  return defineConfig({
    testDir,
    fullyParallel: true,
    retries: 0,
    reporter: [["list"]],
    use: {
      baseURL: `http://localhost:${port}`,
      trace: "retain-on-failure",
    },
    projects: [
      {
        name: "chromium",
        use: {
          browserName: "chromium",
          launchOptions: {
            executablePath: process.env.PW_CHROMIUM_PATH || undefined,
            args: ["--no-sandbox"],
          },
        },
      },
    ],
    webServer: {
      command: serverCommand ?? `npm run build && npx next start -p ${port}`,
      env: serverEnv,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    ...overrides,
  });
}
