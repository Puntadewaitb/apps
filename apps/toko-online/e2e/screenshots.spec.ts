import { test } from "@playwright/test";
import { awasi, buatOrder, login, uniqueIp, varianIds } from "./helpers";
import { products } from "../prisma/seed-data";

/**
 * Membuat screenshot untuk README. Hanya jalan bila SCREENSHOTS=1:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts --project=fitur
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 untuk membuat ulang screenshot");

const OUT = "docs/screenshots";

test.beforeEach(async ({ page }) => {
  await awasi(page);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test("publik (desktop)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/beranda.png` });
  await page.goto("/produk?urut=termurah");
  await page.screenshot({ path: `${OUT}/katalog.png` });
  await page.goto("/produk/kemeja-batik-cap-pria");
  await page.screenshot({ path: `${OUT}/detail-produk.png` });
});

test("keranjang & checkout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const ids = varianIds(products[0]!.slug);
  await page.goto("/");
  await page.evaluate(
    (v) => localStorage.setItem("toko.keranjang.v1", JSON.stringify([{ varianId: v, qty: 2 }])),
    ids[0],
  );
  await page.goto("/keranjang");
  await page.getByTestId("daftar-keranjang").waitFor();
  await page.screenshot({ path: `${OUT}/keranjang.png` });
  await page.goto("/checkout");
  await page.getByLabel(/Nama lengkap/).fill("Siti Aminah");
  await page.getByLabel(/Kota/).fill("Yogyakarta");
  await page.getByTestId("co-total").waitFor();
  await page.screenshot({ path: `${OUT}/checkout.png` });
});

test("mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/mobile-beranda.png` });
});

test("admin", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const o = buatOrder({ status: "DIBAYAR", nama: "Siti Aminah", kota: "Yogyakarta" });
  await login(page);
  await page.screenshot({ path: `${OUT}/admin-dashboard.png` });
  await page.goto("/admin/produk");
  await page.screenshot({ path: `${OUT}/admin-produk.png` });
  await page.goto(`/admin/pesanan/${o.id}`);
  await page.screenshot({ path: `${OUT}/admin-pesanan.png` });
  await page.goto("/admin/pengaturan");
  await page.screenshot({ path: `${OUT}/admin-pengaturan.png` });
});
