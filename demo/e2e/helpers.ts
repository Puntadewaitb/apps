import { expect, type Page } from "@playwright/test";

export const base = (slug: string) => `/apps/${slug}/`;

/**
 * Pantau galat yang HANYA muncul setelah deploy statis: error console (termasuk hydration mismatch),
 * exception halaman, request ke server yang tak ada (/api, /admin), dan respons >= 400 pada origin sendiri.
 */
export function pantau(page: Page) {
  const galat: string[] = [];
  const request: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") galat.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => galat.push(`pageerror: ${e.message}`));
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.hostname === "localhost" && r.status() >= 400)
      galat.push(`HTTP ${r.status()} ${u.pathname}`);
  });
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost") return;
    request.push(`${r.method()} ${u.pathname}`);
    if (/\/(api|admin)(\/|$)/.test(u.pathname)) galat.push(`request ke server: ${u.pathname}`);
    if (r.method() !== "GET" && r.method() !== "HEAD")
      galat.push(`request non-GET: ${r.method()} ${u.pathname}`);
  });
  return { galat, request };
}

/** Semua <img> yang tampil harus benar-benar termuat (bukan ikon rusak karena path salah). */
export async function gambarTermuat(page: Page) {
  await page.waitForLoadState("load");
  const rusak = await page.evaluate(async () => {
    const imgs = [...document.images];
    imgs.forEach((i) => (i.loading = "eager")); // gambar lazy di luar layar ikut dimuat
    await Promise.all(
      imgs.map((i) =>
        i.complete
          ? null
          : new Promise((r) => {
              i.onload = i.onerror = () => r(null);
              setTimeout(() => r(null), 8000);
            }),
      ),
    );
    return imgs.filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute("src"));
  });
  expect(rusak, "gambar gagal dimuat").toEqual([]);
}

export async function tanpaOverflow(page: Page, lebar = 360) {
  await page.setViewportSize({ width: lebar, height: 800 });
  const lebih = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(lebih, `overflow horizontal di ${lebar}px`).toBeLessThanOrEqual(0);
}

export async function cekDasar(page: Page, judul: RegExp) {
  await expect(page).toHaveTitle(judul);
  await expect(page.locator("#demo-banner")).toBeVisible();
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((m) => m.map((e) => e.getAttribute("content")));
  expect(robots.length, "meta robots").toBeGreaterThan(0);
  for (const r of robots) expect(r, "semua meta robots harus noindex").toMatch(/noindex/);
}
