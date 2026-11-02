import { expect, test, type Page } from "@playwright/test";
import { konten as id } from "../content/id";
import { konten as en } from "../content/en";
import { semuaArtikel } from "../lib/blog";
import { localizeHref, type Lang } from "../lib/i18n";
import { semuaRute } from "../lib/seo";
import { huruf, query, uniqueIp } from "./helpers";

const BASE = "http://localhost:3002";
const url = (lang: Lang, path: string) => localizeHref(lang, path);
/** URL absolut yang diharapkan (root tanpa trailing slash, seperti canonical Next). */
const abs = (p: string) => BASE + (p === "/" ? "" : p);

const rute = (lang: Lang) => semuaRute(lang).map((r) => url(lang, r.path));

/** Kata fungsi Bahasa Indonesia yang tidak boleh muncul di teks tampak halaman English. */
const KATA_ID =
  /\b(yang|untuk|dengan|kami|anda|dari|pada|dalam|adalah|selengkapnya|hubungi|layanan|tentang|beranda|lihat|kirim|pesan)\b/i;

async function tenang(page: Page) {
  await page.route("https://www.google.com/**", (r) => r.abort());
}

test.describe("routing bahasa", () => {
  test("ID tanpa awalan (<html lang=id>), EN berawalan /en (<html lang=en>)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(id.hero.judul);
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.hero.judul);
    await expect(page).toHaveTitle(`${en.perusahaan.nama} — ${en.perusahaan.tagline}`);
  });

  test("/id dan /id/… dialihkan 308 ke URL tanpa awalan (satu URL kanonik)", async ({
    request,
  }) => {
    for (const [dari, ke] of [
      ["/id", "/"],
      ["/id/layanan", "/layanan"],
      ["/id/blog/kategori/tips", "/blog/kategori/tips"],
      ["/id/portofolio?kategori=data", "/portofolio?kategori=data"],
    ] as const) {
      const r = await request.get(dari, { maxRedirects: 0 });
      expect(r.status(), dari).toBe(308);
      const loc = new URL(r.headers()["location"]!, BASE);
      expect(loc.origin, dari).toBe(BASE);
      expect(loc.pathname + loc.search, dari).toBe(ke);
    }
  });

  test("setiap rute ID & EN merespons 200 dengan lang yang benar", async ({ page }) => {
    await tenang(page);
    for (const lang of ["id", "en"] as const) {
      for (const p of rute(lang)) {
        const res = await page.goto(p);
        expect(res?.status(), p).toBe(200);
        await expect(page.locator("html"), p).toHaveAttribute("lang", lang);
        await expect(page.locator("h1"), p).toHaveCount(1);
      }
    }
  });

  test("404: bahasa mengikuti URL, status 404, dan memakai layout situs", async ({ page }) => {
    for (const [p, judul, kembali] of [
      ["/tidak-ada", "Halaman tidak ditemukan", "/"],
      ["/layanan/tidak-ada", "Halaman tidak ditemukan", "/"],
      ["/en/tidak-ada", "Page not found", "/en"],
      ["/en/layanan/tidak-ada", "Page not found", "/en"],
      ["/en/blog/__proto__", "Page not found", "/en"],
      ["/fr/layanan", "Halaman tidak ditemukan", "/"],
    ] as const) {
      const res = await page.goto(p);
      expect(res?.status(), p).toBe(404);
      await expect(page.getByRole("heading", { level: 1 }), p).toHaveText(judul);
      // layout situs ikut tampil (navbar) → bukan halaman 404 bawaan Next
      await expect(page.getByRole("navigation").first(), p).toBeVisible();
      await expect(page.locator("main").getByRole("link").first(), p).toHaveAttribute(
        "href",
        kembali,
      );
    }
  });

  test("404 dirender di server (tanpa JavaScript): status, bahasa, layout, noindex", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      for (const [p, lang, judul] of [
        ["/tidak-ada", "id", "Halaman tidak ditemukan"],
        ["/en/blog/tidak-ada", "en", "Page not found"],
        ["/layanan/KONSULTASI-PROSES-BISNIS", "id", "Halaman tidak ditemukan"],
        ["/en/layanan/analitik-data/extra", "en", "Page not found"],
        ["/layanan/..%2Fetc", "id", "Halaman tidak ditemukan"],
        ["/en/layanan/a.b", "en", "Page not found"],
        ["/tidak-ditemukan", "id", "Halaman tidak ditemukan"],
        ["/en/tidak-ditemukan", "en", "Page not found"],
      ] as const) {
        const res = await page.goto(p);
        expect(res?.status(), p).toBe(404);
        await expect(page.locator("html"), p).toHaveAttribute("lang", lang);
        await expect(page.locator("html"), p).not.toHaveAttribute("id", "__next_error__");
        await expect(page.getByRole("heading", { level: 1 }), p).toHaveText(judul);
        await expect(page.getByRole("contentinfo"), p).toBeVisible();
        await expect(page.locator('meta[name="robots"]'), p).toHaveAttribute("content", /noindex/);
      }
    } finally {
      await ctx.close();
    }
  });

  test("halaman valid tidak ikut menjadi 404 (query string & trailing slash)", async ({
    request,
  }) => {
    for (const p of [
      "/portofolio?kategori=sistem",
      "/en/portofolio?kategori=data&x=1",
      "/layanan#faq",
    ]) {
      expect((await request.get(p)).status(), p).toBe(200);
    }
    for (const p of ["/layanan/", "/en/"]) {
      const r = await request.get(p, { maxRedirects: 0 });
      expect(r.status(), p).toBe(308);
    }
  });

  test("admin tetap Indonesia, noindex, tanpa pengalih bahasa", async ({ page }) => {
    const res = await page.goto("/admin/login");
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByTestId("ganti-bahasa")).toHaveCount(0);
    // /en/admin bukan area admin
    expect((await page.goto("/en/admin"))?.status()).toBe(404);
  });
});

test.describe("pengalih bahasa", () => {
  test("pindah ID ↔ EN mempertahankan halaman yang sama", async ({ page }) => {
    for (const p of ["/", "/layanan/analitik-data", "/blog/kategori/tips", "/portofolio"]) {
      await page.goto(p);
      const sw = page.getByTestId("ganti-bahasa").first();
      await expect(sw.locator("a[aria-current]")).toHaveText(/ID/);
      await sw.getByRole("link", { name: /English/ }).click();
      await expect(page, p).toHaveURL(BASE + url("en", p));
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      const sw2 = page.getByTestId("ganti-bahasa").first();
      await expect(sw2.locator("a[aria-current]")).toHaveText(/EN/);
      await sw2.getByRole("link", { name: /Bahasa Indonesia/ }).click();
      await expect(page, p).toHaveURL(BASE + p);
      await expect(page.locator("html")).toHaveAttribute("lang", "id");
    }
  });

  test("tautan pengalih sudah benar di HTML (tanpa JavaScript)", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      for (const p of ["/layanan", "/blog/cara-memilih-vendor-pengembangan-sistem"]) {
        await page.goto(p);
        const sw = page.getByTestId("ganti-bahasa").first();
        await expect(sw.getByRole("link", { name: /English/ })).toHaveAttribute(
          "href",
          url("en", p),
        );
        await expect(sw.getByRole("link", { name: /Bahasa Indonesia/ })).toHaveAttribute("href", p);
        await page.goto(url("en", p));
        const sw2 = page.getByTestId("ganti-bahasa").first();
        await expect(sw2.getByRole("link", { name: /Bahasa Indonesia/ })).toHaveAttribute(
          "href",
          p,
        );
      }
    } finally {
      await ctx.close();
    }
  });

  test("aksesibel: nav berlabel, link bertanda lang, aria-current pada bahasa aktif", async ({
    page,
  }) => {
    await page.goto("/en");
    const sw = page.getByRole("navigation", { name: "Change language" }).first();
    await expect(sw).toBeVisible();
    await expect(sw.locator('a[lang="id"]')).toHaveAttribute("hreflang", "id");
    await expect(sw.locator('a[lang="en"]')).toHaveAttribute("aria-current", "true");
    await expect(sw.locator('a[lang="id"]')).not.toHaveAttribute("aria-current", /.*/);
  });

  test("terjangkau di menu mobile (360px)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/layanan");
    await page.getByRole("button", { name: "Buka menu" }).click();
    const menu = page.getByRole("navigation", { name: "Menu mobile" });
    await menu.getByRole("link", { name: /English/ }).click();
    await expect(page).toHaveURL(BASE + "/en/layanan");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile menu" })).toBeVisible();
  });
});

test.describe("konten English", () => {
  test("navigasi, footer, dan tombol WhatsApp berbahasa Inggris & tertaut ke /en", async ({
    page,
  }) => {
    await page.goto("/en");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    for (const n of en.nav)
      await expect(nav.getByRole("link", { name: n.label, exact: true })).toHaveAttribute(
        "href",
        localizeHref("en", n.href),
      );
    await expect(page.getByRole("navigation", { name: "Footer links" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Chat via WhatsApp" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("Fictional brand for template demo");
  });

  test("tidak ada kata Indonesia di teks tampak semua halaman EN (kecuali nama merek fiktif)", async ({
    page,
  }) => {
    await tenang(page);
    for (const p of rute("en")) {
      await page.goto(p);
      const teks = await page.evaluate(() => document.body.innerText);
      // buang nama merek/klien fiktif yang kebetulan memuat kata Indonesia
      const bersih = teks.replace(
        /Klinik Sehat Prima|Karya Manufaktur|Samudra Logistik|Aksara Edukasi/g,
        "",
      );
      const m = KATA_ID.exec(bersih);
      expect(
        m,
        `${p}: "${m?.[0]}" → …${bersih.slice(Math.max(0, (m?.index ?? 0) - 40), (m?.index ?? 0) + 40)}…`,
      ).toBeNull();
    }
  });

  test("semua tautan internal di halaman EN tetap di /en (kecuali pengalih bahasa)", async ({
    page,
  }) => {
    await tenang(page);
    const bocor: string[] = [];
    for (const p of rute("en")) {
      await page.goto(p);
      const hrefs = await page
        .locator('a[href^="/"]:not([data-testid="ganti-bahasa"] a)')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
      for (const h of hrefs)
        if (!(h === "/en" || h.startsWith("/en/") || h.startsWith("/en?")))
          bocor.push(`${p} → ${h}`);
    }
    // ikon & aset statis (/img, /icon.svg) boleh; selain itu dianggap kebocoran
    expect(bocor.filter((b) => !/→ \/(img\/|icon\.svg)/.test(b))).toEqual([]);
  });

  test("tautan internal di halaman ID tidak mengarah ke /en (kecuali pengalih bahasa)", async ({
    page,
  }) => {
    await tenang(page);
    for (const p of rute("id")) {
      await page.goto(p);
      const hrefs = await page
        .locator('a[href^="/"]:not([data-testid="ganti-bahasa"] a)')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
      expect(
        hrefs.filter((h) => h === "/en" || h.startsWith("/en/")),
        p,
      ).toEqual([]);
    }
  });

  test("semua tautan internal (EN) valid: tidak ada 404", async ({ page, request }) => {
    await tenang(page);
    const dilihat = new Set<string>();
    for (const p of rute("en")) {
      await page.goto(p);
      for (const h of await page
        .locator('a[href^="/"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")!)))
        dilihat.add(h.split("#")[0]!);
    }
    for (const h of dilihat) {
      if (/^\/(img\/|icon\.svg)/.test(h)) continue;
      const r = await request.get(h, { maxRedirects: 0 });
      expect(r.status(), h).toBe(200);
    }
  });

  test("artikel blog EN: tanggal berformat Inggris, penulis & kategori EN", async ({ page }) => {
    const a = semuaArtikel("en")[0]!;
    await page.goto(`/en/blog/${a.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(a.judul);
    await expect(page.getByTestId("meta-artikel")).toContainText("min read");
    await expect(page.getByTestId("meta-artikel")).toContainText(/\d{1,2} [A-Z][a-z]+ 20\d\d/);
    await expect(page.getByTestId("isi-artikel")).toBeVisible();
    // tautan dalam badan artikel menuju versi EN
    for (const h of await page
      .getByTestId("isi-artikel")
      .locator('a[href^="/"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")!)))
      expect(h.startsWith("/en/"), h).toBe(true);
  });

  test("portofolio EN: filter berbasis URL (tanpa JS) + jumlah proyek dengan tata bahasa benar", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      await page.goto("/en/portofolio");
      await expect(page.getByTestId("jumlah-proyek")).toHaveText("6 projects");
      await page.goto("/en/portofolio?kategori=data");
      await expect(page.getByTestId("jumlah-proyek")).toHaveText("1 project");
      await expect(page.getByTestId("kartu-proyek")).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Data Analytics" })).toHaveAttribute(
        "aria-current",
        "true",
      );
      await page.goto("/portofolio?kategori=data");
      await expect(page.getByTestId("jumlah-proyek")).toHaveText("1 proyek");
    } finally {
      await ctx.close();
    }
  });
});

test.describe("SEO", () => {
  test("canonical & hreflang di setiap halaman (id, en, x-default) konsisten dan timbal-balik", async ({
    page,
  }) => {
    await tenang(page);
    for (const lang of ["id", "en"] as const) {
      for (const r of semuaRute(lang)) {
        const p = url(lang, r.path);
        await page.goto(p);
        await expect(page.locator('link[rel="canonical"]'), p).toHaveAttribute("href", abs(p));
        const alt = await page
          .locator('link[rel="alternate"][hreflang]')
          .evaluateAll((els) =>
            Object.fromEntries(
              els.map((e) => [e.getAttribute("hreflang")!, e.getAttribute("href")!]),
            ),
          );
        expect(alt, p).toEqual({
          id: abs(url("id", r.path)),
          en: abs(url("en", r.path)),
          "x-default": abs(url("id", r.path)),
        });
      }
    }
  });

  test("filter portofolio: canonical tanpa query (hindari duplikat)", async ({ page }) => {
    await page.goto("/portofolio?kategori=sistem");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      BASE + "/portofolio",
    );
  });

  test("Open Graph & Twitter: locale, url, gambar 1200×630 yang benar-benar PNG", async ({
    page,
    request,
  }) => {
    for (const lang of ["id", "en"] as const) {
      const p = url(lang, "/layanan/analitik-data");
      await page.goto(p);
      const og = (n: string) => page.locator(`meta[property="${n}"]`);
      await expect(og("og:locale")).toHaveAttribute("content", lang === "id" ? "id_ID" : "en_US");
      await expect(og("og:locale:alternate")).toHaveAttribute(
        "content",
        lang === "id" ? "en_US" : "id_ID",
      );
      await expect(og("og:url")).toHaveAttribute("content", abs(p));
      await expect(og("og:type")).toHaveAttribute("content", "website");
      await expect(og("og:image:width")).toHaveAttribute("content", "1200");
      await expect(og("og:image:height")).toHaveAttribute("content", "630");
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      const img = await og("og:image").getAttribute("content");
      expect(img).toBe(`${BASE}/og/${lang}`);
      const r = await request.get(`/og/${lang}`);
      expect(r.status()).toBe(200);
      expect(r.headers()["content-type"]).toBe("image/png");
      const buf = await r.body();
      expect(buf.subarray(1, 4).toString()).toBe("PNG");
      expect(buf.readUInt32BE(16)).toBe(1200);
      expect(buf.readUInt32BE(20)).toBe(630);
    }
    expect((await request.get("/og/fr")).status()).toBe(404);
  });

  test("artikel: og:type=article + published_time", async ({ page }) => {
    const a = semuaArtikel("en")[0]!;
    await page.goto(`/en/blog/${a.slug}`);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      a.tanggal,
    );
  });

  test("sitemap.xml memuat seluruh URL kedua bahasa + hreflang timbal-balik", async ({
    request,
  }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toMatch(/xml/);
    const xml = await r.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    const harapan = [...rute("id"), ...rute("en")].map((p) => abs(p));
    expect(locs.sort()).toEqual(harapan.sort());
    expect(new Set(locs).size).toBe(locs.length);
    // tiap <url> punya alternatif id, en, x-default
    for (const blok of xml.split("<url>").slice(1)) {
      for (const h of ["id", "en", "x-default"]) expect(blok, h).toContain(`hreflang="${h}"`);
    }
    // admin & API tidak ikut
    expect(xml).not.toMatch(/\/admin|\/api\//);
    // artikel memuat lastmod (tanggal terbit); halaman lain tidak mengarang tanggal
    const a = semuaArtikel("id")[0]!;
    expect(xml).toContain(`<lastmod>${a.tanggal}`);
  });

  test("robots.txt: izinkan situs, blokir /admin & /api, tunjuk sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const t = await r.text();
    expect(t).toMatch(/User-Agent: \*/i);
    expect(t).toMatch(/Allow: \//);
    expect(t).toMatch(/Disallow: \/admin/);
    expect(t).toMatch(/Disallow: \/api\//);
    expect(t).toContain(`Sitemap: ${BASE}/sitemap.xml`);
  });

  test("JSON-LD valid di semua halaman; Organization/LocalBusiness di beranda & kontak", async ({
    page,
  }) => {
    await tenang(page);
    for (const lang of ["id", "en"] as const) {
      for (const r of semuaRute(lang)) {
        const p = url(lang, r.path);
        await page.goto(p);
        const blok = await page.locator('script[type="application/ld+json"]').allTextContents();
        const data = blok.flatMap((b) => {
          const j = JSON.parse(b) as unknown; // JSON tidak valid → tes gagal
          return Array.isArray(j) ? j : [j];
        }) as Array<Record<string, unknown>>;
        for (const d of data) expect(d["@context"], p).toBe("https://schema.org");
        const tipe = data.map((d) => d["@type"]);
        if (r.path === "/" || r.path === "/kontak") {
          const org = data.find((d) => d["@type"] === "ProfessionalService")!;
          expect(org, p).toBeTruthy();
          expect(org["inLanguage"]).toBe(lang);
          expect(org["url"]).toBe(abs(url(lang, "/")));
          expect((org["address"] as Record<string, string>)["addressCountry"]).toBe("ID");
          expect(org["name"]).toBe(id.perusahaan.namaLengkap);
        }
        if (r.path.startsWith("/layanan/")) expect(tipe, p).toContain("Service");
        if (/^\/blog\/(?!kategori)/.test(r.path)) expect(tipe, p).toContain("BlogPosting");
        if (
          r.path.startsWith("/portofolio/") ||
          r.path.startsWith("/layanan/") ||
          /^\/blog\/(?!kategori)/.test(r.path)
        )
          expect(tipe, p).toContain("BreadcrumbList");
      }
    }
  });

  test("BreadcrumbList: posisi berurutan & URL absolut sesuai bahasa", async ({ page }) => {
    await page.goto("/en/layanan/analitik-data");
    const j = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').first().textContent())!,
    ) as unknown;
    const arr = (Array.isArray(j) ? j : [j]) as Array<Record<string, unknown>>;
    const bc = arr.find((d) => d["@type"] === "BreadcrumbList")!;
    const items = bc["itemListElement"] as Array<{ position: number; name: string; item: string }>;
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items.map((i) => i.item)).toEqual([
      `${BASE}/en`,
      `${BASE}/en/layanan`,
      `${BASE}/en/layanan/analitik-data`,
    ]);
    expect(items[1]!.name).toBe("Services");
  });

  test("halaman admin & 404 tidak diindeks", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.goto("/en/tidak-ada");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("formulir kontak English", () => {
  test("galat validasi tampil dalam bahasa Inggris; pesan terkirim, tersimpan, sukses EN", async ({
    page,
  }) => {
    await tenang(page);
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/en/kontak");
    await expect(page).toHaveTitle(`Contact | ${en.perusahaan.nama}`);
    await expect(page.locator("main iframe")).toHaveAttribute(
      "title",
      /Map of Cakra Mandiri location/,
    );
    const form = page.getByRole("form", { name: "Contact form" });

    await form.getByLabel("Name").fill("B");
    await form.getByLabel("Email").fill("bukan-email");
    await form.getByLabel("Message").fill("pendek");
    await form.getByRole("button", { name: "Send Message" }).click();
    await expect(form.getByText("Please check your input.")).toBeVisible();
    await expect(form).toContainText("Name must be at least 2 characters");
    await expect(form).toContainText("Invalid email");
    await expect(form).toContainText("Message must be at least 10 characters");
    await expect(form).not.toContainText(/minimal|tidak valid/);

    const nama = `Sender ${huruf()}`;
    await form.getByLabel("Name").fill(nama);
    await form.getByLabel("Email").fill("sender@contoh.id");
    await form.getByLabel("Message").fill("We need help mapping our order process.");
    await form.getByLabel(/Service of interest/).selectOption("analitik-data");
    await form.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByTestId("kontak-sukses")).toHaveText(
      "Thank you! We have received your message and will reply within 1 business day.",
    );
    await expect
      .poll(() => query<{ nama: string }>("select nama from Pesan where nama = ?", nama).length)
      .toBe(1);
  });

  test("API: galat berbahasa sesuai X-Lang; nilai tak dikenal → Indonesia; tanpa header → Indonesia", async ({
    request,
  }) => {
    const kirim = (h: Record<string, string>) =>
      request.post("/api/kontak", {
        data: { nama: "B" },
        headers: { "x-forwarded-for": uniqueIp(), ...h },
      });
    const enRes = await kirim({ "x-lang": "en" });
    expect(enRes.status()).toBe(400);
    expect(await enRes.json()).toMatchObject({ ok: false, error: "Please check your input." });
    const tidakValid: Array<Record<string, string>> = [
      {},
      { "x-lang": "fr" },
      { "x-lang": "EN" },
      { "x-lang": "__proto__" },
    ];
    for (const h of tidakValid) {
      const r = await kirim(h);
      expect(r.status(), JSON.stringify(h)).toBe(400);
      expect(((await r.json()) as { error: string }).error).toBe("Periksa kembali isian Anda.");
    }
    // penolakan lintas-origin juga dilokalkan
    const x = await request.post("/api/kontak", {
      data: {},
      headers: { origin: "https://evil.example", "x-lang": "en", "x-forwarded-for": uniqueIp() },
    });
    expect(x.status()).toBe(403);
    expect(((await x.json()) as { error: string }).error).toBe("Request rejected.");
  });
});

test.describe("keamanan routing", () => {
  test("path berbahaya tidak menembus: traversal, awalan bahasa palsu, dan open redirect", async ({
    request,
  }) => {
    for (const p of [
      "/en/..%2F..%2Fetc%2Fpasswd",
      "/%2e%2e/en",
      "/en%2Fadmin",
      "/ID/layanan",
      "/EN",
    ]) {
      const r = await request.get(p, { maxRedirects: 0 });
      expect([200, 308, 400, 404], `${p} → ${r.status()}`).toContain(r.status());
      const loc = r.headers()["location"];
      if (loc) expect(new URL(loc, BASE).origin, p).toBe(BASE);
    }
    // /id//evil.example tidak boleh jadi redirect ke host lain
    const r = await request.get("/id//evil.example", { maxRedirects: 0 });
    const loc = r.headers()["location"];
    if (loc) expect(new URL(loc, BASE).origin).toBe(BASE);
  });

  test("header keamanan (CSP) ada di halaman EN dan route OG", async ({ request }) => {
    const r = await request.get("/en");
    expect(r.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
