import { expect, test, type Page } from "@playwright/test";
import { loginAdmin } from "./helpers";

/**
 * Membuat screenshot untuk README. Hanya jalan bila SCREENSHOTS=1:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
 * Jam dikunci agar countdown konsisten.
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 untuk membuat ulang screenshot");

const OUT = "docs/screenshots";
const MOBILE = { width: 390, height: 844 };

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2027-02-10T10:00:00+07:00") });
  await page.route("https://www.google.com/**", (r) => r.abort());
});

/** Gulir bertahap melewati seluruh bagian (memicu lazy-load), tunggu gambar selesai, lalu potret. */
async function bagian(page: Page, selector: string, file: string) {
  const el = page.locator(selector);
  const { top, height } = await el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height };
  });
  for (let y = top - 100; y < top + height; y += 300) {
    await page.evaluate((yy) => window.scrollTo(0, Math.max(0, yy)), y);
    await page.waitForTimeout(60);
  }
  // Semua gambar di dalam bagian ini harus sudah selesai dimuat.
  await expect
    .poll(() =>
      el.evaluate((e) =>
        [...e.querySelectorAll("img")].every((i) => i.complete && i.naturalWidth > 0),
      ),
    )
    .toBe(true);
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: `${OUT}/${file}.png` });
}

test("tamu (ponsel)", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/?to=Bapak%20Budi%20%26%20Keluarga");
  await page.screenshot({ path: `${OUT}/cover.png` });
  await page.getByRole("button", { name: "Buka Undangan" }).click();
  await bagian(page, "#mempelai", "mempelai");
  await bagian(page, "#acara", "acara");
  await bagian(page, "#cerita", "cerita");
  await bagian(page, "#galeri", "galeri");
  await bagian(page, "#amplop", "amplop");
  await bagian(page, "#rsvp", "rsvp");
  await bagian(page, "#ucapan", "ucapan");
});

test("tema & jenis acara (pratinjau)", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/tema-floral-pernikahan.png` });
  await loginAdmin(page);
  for (const [slug, file] of [
    ["aqiqah-demo", "tema-islami-aqiqah"],
    ["khitan-demo", "tema-elegan-khitan"],
  ] as const) {
    await page.goto(`/admin/pratinjau/${slug}`);
    await page.screenshot({ path: `${OUT}/${file}.png` });
  }
});

test("admin (desktop)", async ({ page, request }) => {
  await page.setViewportSize({ width: 1100, height: 720 });
  await loginAdmin(page);
  await page.goto("/admin");
  await page.screenshot({ path: `${OUT}/admin-ringkasan.png` });
  await page.goto("/admin/tamu");
  await page.screenshot({ path: `${OUT}/admin-tamu.png` });
  await page.goto("/admin/ucapan");
  await page.screenshot({ path: `${OUT}/admin-ucapan.png` });
  void request;
});
