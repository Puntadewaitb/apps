import { createPlaywrightConfig } from "@tpl/config/playwright";

const browser = {
  browserName: "chromium",
  launchOptions: {
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: ["--no-sandbox"],
  },
};

export default createPlaywrightConfig({
  port: 3005,
  serverCommand: "node e2e/prepare-db.mjs && npm run build && npx next start -p 3005",
  // Bertahap (berurutan): tes admin mengubah data bersama (kategori, produk, stok, pesanan) sehingga tidak boleh
  // berjalan bersamaan dengan tes yang menghitung/membandingkan data itu.  fitur → admin → dasbor
  projects: [
    { name: "fitur", testIgnore: /(admin-|dasbor).*\.spec\.ts/, use: browser },
    { name: "admin", testMatch: /admin-.*\.spec\.ts/, dependencies: ["fitur"], use: browser },
    { name: "dasbor", testMatch: /dasbor\.spec\.ts/, dependencies: ["admin"], use: browser },
  ],
  serverEnv: {
    DATABASE_URL: "file:./e2e.db",
    UPLOAD_DIR: "./e2e-uploads",
    // Banyak tes login dengan akun yang sama dalam satu run → longgarkan batas PER AKUN (batas per IP tetap bawaan).
    LOGIN_LIMIT_EMAIL: "500",
    // Kredensial HANYA untuk tes (DB e2e sekali pakai) — bukan rahasia.
    ADMIN_EMAIL: "admin@toko.example",
    ADMIN_PASSWORD: "e2e-password-bukan-rahasia",
    STAFF_PASSWORD: "e2e-staf-bukan-rahasia",
    NEXTAUTH_SECRET: "e2e-nextauth-secret-0123456789abcdef-xyz",
    NEXTAUTH_URL: "http://localhost:3005",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
