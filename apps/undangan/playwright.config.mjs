import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 3003,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3003",
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    EVENT_SLUG: "raka-anisa",
    // Kredensial HANYA untuk tes (DB e2e sekali pakai) — bukan rahasia.
    ADMIN_PASSWORD: "e2e-password-bukan-rahasia",
    ADMIN_SESSION_SECRET: "e2e-session-secret-0123456789abcdef-xyz",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
