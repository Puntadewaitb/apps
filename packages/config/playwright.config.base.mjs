import { defineConfig } from "@playwright/test";

/**
 * Config Playwright bersama. Hanya project `chromium`.
 * PW_CHROMIUM_PATH di-set di cloud (/opt/pw-browsers/chromium); di CI dikosongkan.
 * webServer memakai build produksi pada port app.
 */
export function createPlaywrightConfig({ port, testDir = "./e2e", ...overrides }) {
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
      command: `npm run build && npx next start -p ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    ...overrides,
  });
}
