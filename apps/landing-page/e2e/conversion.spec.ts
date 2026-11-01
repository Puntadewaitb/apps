import { expect, test } from "@playwright/test";
import { site } from "../content/site";

test("testimoni tampil lengkap dengan catatan fiktif", async ({ page }) => {
  await page.goto("/");
  const items = page.locator("#testimoni li");
  await expect(items).toHaveCount(site.testimonials.items.length);
  for (const t of site.testimonials.items) {
    await expect(page.locator("#testimoni")).toContainText(t.quote);
    await expect(page.locator("#testimoni")).toContainText(t.name);
  }
  await expect(page.locator("#testimoni")).toContainText("fiktif");
});

test("FAQ accordion: buka satu, tutup yang lain, bisa ditutup lagi", async ({ page }) => {
  await page.goto("/");
  const buttons = page.locator("#faq button[aria-expanded]");
  await expect(buttons).toHaveCount(site.faq.items.length);
  await expect(page.locator('#faq button[aria-expanded="true"]')).toHaveCount(0);

  const first = page.getByRole("button", { name: site.faq.items[0]!.q });
  const second = page.getByRole("button", { name: site.faq.items[1]!.q });

  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(site.faq.items[0]!.a)).toBeVisible();

  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText(site.faq.items[0]!.a)).toBeHidden();
  await expect(page.getByText(site.faq.items[1]!.a)).toBeVisible();

  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "false");
});

test("CTA penutup mengarah ke #kontak dan #paket", async ({ page }) => {
  await page.goto("/");
  const closing = page.locator('section[aria-labelledby="penutup-judul"]');
  await expect(closing.getByRole("heading", { level: 2 })).toHaveText(site.closing.title);
  await expect(closing.getByRole("link", { name: site.closing.cta.label })).toHaveAttribute(
    "href",
    site.closing.cta.href,
  );
  await expect(
    closing.getByRole("link", { name: site.closing.secondaryCta.label }),
  ).toHaveAttribute("href", site.closing.secondaryCta.href);
  // kontras: tombol utama penutup berlatar terang, teks gelap
  const btn = closing.getByRole("link", { name: site.closing.cta.label });
  const colors = await btn.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, fg: s.color };
  });
  expect(colors.bg).not.toBe(colors.fg);
  expect(colors.bg).toBe("rgb(255, 255, 255)");
});

test.describe("countdown promo", () => {
  test("tampil dan berdetak saat promo aktif (jam dikunci)", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-12-30T23:59:50+07:00") });
    await page.goto("/");
    const banner = page.getByTestId("promo-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(site.promo.text);
    const timer = banner.getByRole("timer");
    // sisa 9 detik dari 2026-12-31T23:59:59+07:00 dikurangi 2026-12-30T23:59:50 = 1 hari 9 detik
    await expect(timer).toContainText("01h");
    await expect(timer).toContainText("09d");
    await page.clock.fastForward(3000);
    await expect(timer).toContainText("06d");
  });

  test("hilang saat promo berakhir", async ({ page }) => {
    await page.clock.install({ time: new Date("2027-01-02T00:00:00+07:00") });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("promo-banner")).toHaveCount(0);
  });

  test("hilang ketika hitung mundur melewati batas", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-12-31T23:59:57+07:00") });
    await page.goto("/");
    await expect(page.getByTestId("promo-banner")).toBeVisible();
    await page.clock.fastForward(5000);
    await expect(page.getByTestId("promo-banner")).toHaveCount(0);
  });
});
