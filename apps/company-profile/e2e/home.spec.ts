import { expect, test } from "@playwright/test";
import { konten } from "../content/id";

test("beranda 200: judul, hero, CTA, dan kontak dari konten", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(`${konten.perusahaan.nama} — ${konten.perusahaan.tagline}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(konten.hero.judul);
  await expect(page.getByText(konten.hero.subjudul)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.locator("html")).toHaveAttribute("data-theme", konten.tema);

  await expect(page.getByRole("link", { name: konten.hero.cta.label })).toHaveAttribute(
    "href",
    "#kontak",
  );
  await expect(page.locator("#kontak")).toContainText(konten.kontak.email);
  await expect(page.locator("#kontak")).toContainText(konten.kontak.telepon);
  expect(errors).toEqual([]);
});

test("tautan WhatsApp: href wa.me dengan pesan awal, tanpa navigasi", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href^="https://wa.me/"]');
  await expect(links).toHaveCount(2); // CTA hero + tombol mengambang
  for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
    expect(href).toMatch(new RegExp(`^https://wa\\.me/${konten.kontak.whatsapp}\\?text=`));
    expect(decodeURIComponent(href!)).toContain(konten.kontak.pesanWhatsapp);
  }
  await expect(page.locator("a.fixed")).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("link", { name: konten.hero.ctaSekunder.label })).toHaveAttribute(
    "target",
    "_blank",
  );
});

test("gambar hero termuat, ber-alt, dan dioptimasi", async ({ page }) => {
  await page.goto("/");
  const img = page.getByRole("img", { name: konten.hero.gambar.alt });
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);
  await expect(img).toHaveAttribute("fetchpriority", "high");
  await expect(img).toHaveAttribute("width", "640");
});

for (const width of [360, 768, 1280]) {
  test(`tanpa horizontal overflow di ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(over).toBe(false);
  });
}

test("menu mobile membuka & menutup", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu" }).click();
  const nav = page.getByRole("navigation", { name: "Menu mobile" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Beranda" }).click();
  await expect(nav).toBeHidden();
});

test("security headers terpasang, tanpa x-powered-by", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
  expect((await request.get("/img/hero.svg")).headers()["cache-control"]).toContain(
    "max-age=604800",
  );
});

test("404 berbahasa Indonesia", async ({ page }) => {
  const res = await page.goto("/tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
  await expect(page.getByRole("link", { name: "Kembali ke beranda" })).toHaveAttribute("href", "/");
  await expect(page.locator("body")).not.toContainText("could not be found");
});

test("aksesibilitas dasar: satu h1, satu main, landmark, alt gambar", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("footer").last()).toBeVisible();
  for (const img of await page.locator("img").all()) {
    expect(((await img.getAttribute("alt")) ?? "").trim()).toBeTruthy();
  }
});
