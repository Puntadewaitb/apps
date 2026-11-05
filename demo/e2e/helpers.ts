import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Akar situs di hosting (GitHub Pages project site = /<nama-repo>); sama dengan DEMO_BASE_ROOT saat build. */
export const BASE_ROOT = "/" + (process.env.DEMO_BASE_ROOT ?? "/apps").replace(/^\/+|\/+$/g, "");
export const base = (slug: string) => `${BASE_ROOT}/${slug}/`;

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

/**
 * Telusuri seluruh situs statis dari `mulai` lewat tautan <a> internal (BFS): setiap halaman harus 200 dan punya <h1>.
 * Mengembalikan daftar masalah + jumlah halaman yang dikunjungi.
 */
export async function telusuri(request: APIRequestContext, mulai: string[], slug: string) {
  const prefix = `${BASE_ROOT}/${slug}/`;
  const masalah: string[] = [];
  const antre = [...mulai];
  const lihat = new Set<string>();
  while (antre.length) {
    const u = antre.shift()!;
    if (lihat.has(u)) continue;
    lihat.add(u);
    const res = await request.get(u);
    if (res.status() !== 200) masalah.push(`${res.status()} ${u}`);
    const html = await res.text();
    if (!/<h1[\s>]/.test(html)) masalah.push(`tanpa <h1>: ${u}`);
    for (const m of html.matchAll(/<a [^>]*href="([^"#?]*)"/g)) {
      const h = m[1]!;
      if (h.startsWith(prefix) && !lihat.has(h)) antre.push(h);
    }
  }
  return { masalah, jumlah: lihat.size };
}

/**
 * Embed peta (iframe www.google.com) dijawab stub: tes tidak boleh bergantung pada internet, dan jawaban proxy/jaringan
 * (404, ERR_FAILED) tidak boleh tercatat sebagai galat situs. Atribut iframe tetap diperiksa langsung di DOM.
 */
export async function tenang(page: Page) {
  await page.route(/^https:\/\/(www\.)?google\.com\//, (r) =>
    r.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>peta</title>",
    }),
  );
}
