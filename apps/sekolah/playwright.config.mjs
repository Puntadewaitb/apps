import { createPlaywrightConfig } from "@tpl/config/playwright";

const browser = {
  browserName: "chromium",
  launchOptions: {
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ["--no-sandbox"],
  },
};

export default createPlaywrightConfig({
  port: 3004,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3004",
  // Dua tahap: tes CRUD (crud-*.spec.ts) mengubah data bersama (guru, berita, dsb.) sehingga baru jalan
  // SETELAH semua tes fitur selesai — mencegah tes yang menghitung/membandingkan data saling mengganggu.
  projects: [
    { name: "fitur", testIgnore: /crud-.*\.spec\.ts/, use: browser },
    { name: "crud", testMatch: /crud-.*\.spec\.ts/, dependencies: ["fitur"], use: browser },
  ],
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    UPLOAD_DIR: "./e2e-uploads",
    // Banyak tes login dengan akun admin yang sama dalam satu run → longgarkan batas PER AKUN (batas per IP tetap bawaan).
    LOGIN_LIMIT_EMAIL: "500",
    // Kredensial HANYA untuk tes (DB e2e sekali pakai) — bukan rahasia.
    ADMIN_EMAIL: "admin@sekolah.example",
    ADMIN_PASSWORD: "e2e-password-bukan-rahasia",
    EDITOR_PASSWORD: "e2e-editor-bukan-rahasia",
    NEXTAUTH_SECRET: "e2e-nextauth-secret-0123456789abcdef-xyz",
    NEXTAUTH_URL: "http://localhost:3004",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
