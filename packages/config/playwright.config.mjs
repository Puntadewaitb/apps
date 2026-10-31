import { createPlaywrightConfig } from "./playwright.config.base.mjs";

// Smoke test untuk memverifikasi config bersama + Chromium. Bukan e2e app.
export default createPlaywrightConfig({
  port: 3999,
  testDir: "./e2e",
  webServer: {
    command: "node e2e/static-server.mjs",
    url: "http://localhost:3999",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
