import { createPlaywrightConfig } from "@tpl/config/playwright";

// Kredensial di bawah HANYA untuk tes lokal/CI (DB e2e sekali pakai), bukan rahasia.
export const E2E_ADMIN_PASSWORD = "e2e-password-bukan-rahasia";

export default createPlaywrightConfig({
  port: 3001,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3001",
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: "e2e-session-secret-0123456789abcdef-xyz",
    LEAD_RATE_LIMIT: "5",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
