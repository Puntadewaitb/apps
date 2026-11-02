import { test } from "@playwright/test";
import { ADMIN_PASSWORD, uniqueIp } from "./helpers";

/**
 * Membuat screenshot untuk README. Hanya jalan bila SCREENSHOTS=1:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
 * Jam dikunci agar tahun di footer konsisten; Google Maps diblok (tidak ada akses internet).
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 untuk membuat ulang screenshot");

const OUT = "docs/screenshots";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-12-20T10:00:00+07:00") });
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test("beranda desktop (ID & EN)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/beranda-id.png` });
  await page.goto("/en");
  await page.screenshot({ path: `${OUT}/beranda-en.png` });
});

test("layanan, portofolio, blog", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/layanan/analitik-data");
  await page.screenshot({ path: `${OUT}/layanan-detail.png` });
  await page.goto("/portofolio?kategori=sistem");
  await page.screenshot({ path: `${OUT}/portofolio-filter.png` });
  await page.goto("/en/blog/cara-memilih-vendor-pengembangan-sistem");
  await page.screenshot({ path: `${OUT}/blog-artikel-en.png` });
});

test("kontak (form + info)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/kontak");
  await page.addStyleTag({ content: "iframe{visibility:hidden}" });
  await page.locator("#form-kontak").screenshot({ path: `${OUT}/kontak.png` });
});

test("mobile: beranda & menu (EN)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await page.screenshot({ path: `${OUT}/mobile-beranda-en.png` });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.screenshot({
    path: `${OUT}/mobile-menu-en.png`,
    clip: { x: 0, y: 0, width: 390, height: 460 },
  });
});

test("admin pesan", async ({ page, request }) => {
  for (const [nama, layanan, isi] of [
    ["Rina Wulandari", "analitik-data", "Kami ingin dasbor penjualan untuk 12 cabang."],
    ["Agus Prasetyo", "pelatihan-sdm", "Mohon proposal pelatihan 40 peserta untuk ERP baru."],
    [
      "Maya Anggraini",
      "konsultasi-proses-bisnis",
      "Ingin memetakan proses pengadaan di perusahaan kami.",
    ],
  ] as const) {
    await request.post("/api/kontak", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { nama, email: `${nama.split(" ")[0]!.toLowerCase()}@contoh.id`, layanan, isi },
    });
  }
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin\/pesan$/);
  await page.screenshot({ path: `${OUT}/admin-pesan.png` });
});
