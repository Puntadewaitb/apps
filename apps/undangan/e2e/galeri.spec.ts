import { expect, test, type Page } from "@playwright/test";

async function bukaUndangan(page: Page) {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Buka Undangan" }).click();
}

const thumbs = (page: Page) => page.locator("#galeri ul button");
const dialog = (page: Page) => page.getByRole("dialog", { name: "Pratinjau gambar" });

test("galeri: 6 thumbnail ber-alt dan semua gambar termuat", async ({ page }) => {
  await bukaUndangan(page);
  await expect(thumbs(page)).toHaveCount(6);
  for (const img of await page.locator("#galeri img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute("alt", /Foto galeri \d/);
    await expect(img).toHaveAttribute("loading", "lazy");
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  }
});

test("lightbox: buka, caption, navigasi (tombol & keyboard, berputar), tutup", async ({ page }) => {
  await bukaUndangan(page);
  await thumbs(page).nth(0).click();
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).locator("img")).toHaveAttribute("src", "/img/galeri-1.svg");
  await expect(dialog(page).locator("figcaption")).toHaveText("Foto galeri 1");

  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(dialog(page).locator("img")).toHaveAttribute("src", "/img/galeri-2.svg");
  await page.keyboard.press("ArrowRight");
  await expect(dialog(page).locator("img")).toHaveAttribute("src", "/img/galeri-3.svg");
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Sebelumnya" }).click();
  await expect(dialog(page).locator("img")).toHaveAttribute("src", "/img/galeri-1.svg");
  // berputar ke foto terakhir
  await page.keyboard.press("ArrowLeft");
  await expect(dialog(page).locator("img")).toHaveAttribute("src", "/img/galeri-6.svg");
  await page.keyboard.press("ArrowRight");
  await expect(dialog(page).locator("img")).toHaveAttribute("src", "/img/galeri-1.svg");

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
});

test("lightbox: tutup lewat tombol & klik latar; klik gambar tidak menutup", async ({ page }) => {
  await bukaUndangan(page);
  await thumbs(page).nth(2).click();
  await dialog(page).locator("img").click();
  await expect(dialog(page)).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).click();
  await expect(dialog(page)).toBeHidden();

  await thumbs(page).nth(3).click();
  await dialog(page).click({ position: { x: 5, y: 5 } }); // latar gelap
  await expect(dialog(page)).toBeHidden();
});

test("lightbox: fokus pindah ke tombol tutup, scroll terkunci, fokus kembali ke thumbnail", async ({
  page,
}) => {
  await bukaUndangan(page);
  const t = thumbs(page).nth(1);
  await t.click();
  await expect(page.getByRole("button", { name: "Tutup" })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(t).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("timeline cerita: 4 peristiwa berurutan dengan tahun & judul", async ({ page }) => {
  await bukaUndangan(page);
  const items = page.getByTestId("peristiwa");
  await expect(items).toHaveCount(4);
  await expect(items.locator("time")).toHaveText(["2019", "2021", "2024", "2027"]);
  await expect(items.locator("h3")).toHaveText([
    "Pertama Bertemu",
    "Mulai Dekat",
    "Lamaran",
    "Hari Bahagia",
  ]);
  await expect(page.locator("#cerita ol")).toHaveCount(1);
});

test("video opsional: tanpa URL tidak ada iframe YouTube & CSP tidak melebar", async ({
  page,
  request,
}) => {
  await bukaUndangan(page);
  await expect(page.locator("#video")).toHaveCount(0);
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  const csp = (await request.get("/")).headers()["content-security-policy"]!;
  expect(csp).not.toContain("youtube");
});

test("tanpa overflow horizontal di 360/768/1280, juga saat lightbox terbuka", async ({ page }) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const over = () =>
      page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(await over(), `overflow ${width}px`).toBe(false);
    await thumbs(page).first().scrollIntoViewIfNeeded();
    await thumbs(page).first().click();
    expect(await over(), `overflow lightbox ${width}px`).toBe(false);
    await expect(page.getByRole("button", { name: "Tutup" })).toBeInViewport();
    await page.keyboard.press("Escape");
  }
});
