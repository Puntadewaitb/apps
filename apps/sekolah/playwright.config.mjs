import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 3004,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3004",
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    // Kredensial HANYA untuk tes (DB e2e sekali pakai) — bukan rahasia.
    ADMIN_EMAIL: "admin@sekolah.example",
    ADMIN_PASSWORD: "e2e-password-bukan-rahasia",
    NEXTAUTH_SECRET: "e2e-nextauth-secret-0123456789abcdef-xyz",
    NEXTAUTH_URL: "http://localhost:3004",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
