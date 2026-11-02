import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 3002,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3002",
  globalSetup: "./e2e/global-setup.ts",
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    // Kredensial HANYA untuk tes (DB e2e sekali pakai) — bukan rahasia.
    ADMIN_PASSWORD: "e2e-password-bukan-rahasia",
    ADMIN_SESSION_SECRET: "e2e-session-secret-0123456789abcdef-xyz",
    // SMTP mengarah ke sink lokal (lihat e2e/smtp-sink.ts)
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "2525",
    MAIL_TO: "admin@cakramandiri.example",
    MAIL_FROM: "website@cakramandiri.example",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
