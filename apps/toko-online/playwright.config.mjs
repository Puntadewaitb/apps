import { createPlaywrightConfig } from "@tpl/config/playwright";

export default createPlaywrightConfig({
  port: 3005,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3005",
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    UPLOAD_DIR: "./e2e-uploads",
    // Kredensial HANYA untuk tes (DB e2e sekali pakai) — bukan rahasia.
    ADMIN_EMAIL: "admin@toko.example",
    ADMIN_PASSWORD: "e2e-password-bukan-rahasia",
    STAFF_PASSWORD: "e2e-staf-bukan-rahasia",
    NEXTAUTH_SECRET: "e2e-nextauth-secret-0123456789abcdef-xyz",
    NEXTAUTH_URL: "http://localhost:3005",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
