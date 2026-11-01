import { expect, test } from "@playwright/test";
import { site } from "../content/site";

const BASE = "http://localhost:3001";

test("metadata: title, description, canonical, Open Graph, Twitter", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(`${site.brand} — ${site.tagline}`);
  const meta = (sel: string) => page.locator(sel).getAttribute("content");
  expect(await meta('meta[name="description"]')).toBe(site.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", BASE);
  expect(await meta('meta[property="og:title"]')).toContain(site.brand);
  expect(await meta('meta[property="og:locale"]')).toBe(site.locale);
  expect(await meta('meta[property="og:type"]')).toBe("website");
  expect(await meta('meta[property="og:image"]')).toMatch(
    new RegExp(`^${BASE}/opengraph-image(\\?[a-z0-9]+)?$`),
  );
  expect(await meta('meta[property="og:image:width"]')).toBe("1200");
  expect(await meta('meta[property="og:image:height"]')).toBe("630");
  expect(await meta('meta[name="twitter:image"]')).toMatch(/opengraph-image|twitter-image/);
  expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  expect(await meta('meta[name="robots"]')).toContain("index");
});

test("OG image: PNG 1200x630 dibuat lokal", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const buf = await res.body();
  expect([...buf.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(buf.readUInt32BE(16)).toBe(1200); // lebar (IHDR)
  expect(buf.readUInt32BE(20)).toBe(630); // tinggi
  expect(buf.length).toBeGreaterThan(2000);
});

test("robots.txt & sitemap.xml", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/User-Agent: \*/i);
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toContain(`Sitemap: ${BASE}/sitemap.xml`);

  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("xml");
  expect(await res.text()).toContain(`<loc>${BASE}/</loc>`);
});

test("structured data JSON-LD valid: Organization, WebSite, SoftwareApplication, FAQPage", async ({
  page,
}) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(raw).toHaveLength(1);
  const graph = JSON.parse(raw[0]!)["@graph"] as Array<Record<string, unknown>>;
  expect(graph.map((n) => n["@type"])).toEqual([
    "Organization",
    "WebSite",
    "SoftwareApplication",
    "FAQPage",
  ]);
  const faq = graph.find((n) => n["@type"] === "FAQPage") as { mainEntity: unknown[] };
  expect(faq.mainEntity).toHaveLength(site.faq.items.length);
  const app = graph.find((n) => n["@type"] === "SoftwareApplication") as {
    offers: Array<{ price: number; priceCurrency: string }>;
  };
  expect(app.offers.map((o) => o.price)).toEqual([0, 59000, 149000]);
  expect(app.offers.every((o) => o.priceCurrency === "IDR")).toBe(true);
});

test("tracking mati bila env kosong: tak ada skrip/host pihak ketiga & CSP tetap ketat", async ({
  page,
  request,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost") external.push(u.hostname);
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  expect(external).toEqual([]);
  const html = await page.content();
  expect(html).not.toMatch(/googletagmanager|google-analytics|connect\.facebook\.net|fbq\(/);
  const csp = (await request.get("/")).headers()["content-security-policy"]!;
  expect(csp).not.toMatch(/googletagmanager|google-analytics|facebook/);
});

test("halaman admin tidak diindeks", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("gambar demo di-cache & ber-atribut optimasi", async ({ page, request }) => {
  const res = await request.get("/img/hero.svg");
  expect(res.headers()["cache-control"]).toContain("max-age=604800");
  await page.goto("/");
  await expect(page.locator('img[src="/img/hero.svg"]')).toHaveAttribute("fetchpriority", "high");
  const lazy = page.locator('#paket img[loading="lazy"]');
  await expect(lazy).toHaveCount(site.showcase.items.length);
  for (const img of await page.locator("img").all()) {
    await expect(img).toHaveAttribute("width", /\d+/);
    await expect(img).toHaveAttribute("height", /\d+/);
  }
});

test.describe("tema", () => {
  const expected = { netral: "#1d4ed8", hangat: "#c2410c", hijau: "#166534" } as const;

  test("default sesuai site.theme", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", site.theme);
  });

  for (const [theme, primary] of Object.entries(expected)) {
    test(`palet ${theme} menerapkan warna primer ${primary}`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      const btn = page.locator("main a").first(); // CTA utama (bg-primary)
      await expect
        .poll(() => btn.evaluate((el) => getComputedStyle(el).backgroundColor))
        .toBe(hexToRgb(primary));
    });
  }
});

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
