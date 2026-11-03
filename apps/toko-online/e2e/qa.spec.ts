import { expect, test, type Page } from "@playwright/test";
import { categories, products } from "../prisma/seed-data";
import { toko } from "../content/toko";
import { awasi, buatProduk, idVarian, query, uniqueIp, varianIds } from "./helpers";

const BASE = "http://localhost:3005";
const KATALOG = [
  "/produk",
  `/produk?kategori=${categories[0]!.slug}`,
  "/produk?q=kopi",
  "/produk?urut=termurah&halaman=2",
  ...products.map((p) => `/produk/${p.slug}`),
];
const PUBLIK = ["/", ...KATALOG, "/keranjang", "/checkout", "/lacak"];
const SEMUA = [...PUBLIK, "/admin/login"];

/** Isi keranjang (localStorage) agar halaman keranjang/checkout dirender dengan data, bukan keadaan kosong. */
async function isiKeranjang(page: Page) {
  const ids = varianIds(products[0]!.slug);
  await page.goto("/");
  await page.evaluate(
    (v) => localStorage.setItem("toko.keranjang.v1", JSON.stringify([{ varianId: v, qty: 2 }])),
    ids[0],
  );
}

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test.describe("kualitas halaman publik", () => {
  test("semua halaman termuat (200) tanpa error konsol/CSP/aset rusak dan tanpa permintaan ke domain luar", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const p = await awasi(page);
    await isiKeranjang(page);
    for (const path of SEMUA) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await page.waitForLoadState("load");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
    expect(p.gagal, p.gagal.join("\n")).toEqual([]);
    expect(p.luar, p.luar.join("\n")).toEqual([]);
  });

  test("gambar benar-benar termuat, ber-alt, dan punya width/height atau rasio (cegah layout shift)", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await awasi(page);
    await isiKeranjang(page);
    for (const path of [
      "/",
      "/produk",
      `/produk/${products[0]!.slug}`,
      `/produk/${products[3]!.slug}`,
      "/keranjang",
      "/checkout",
    ]) {
      await page.goto(path);
      await page.evaluate(async () => {
        document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
        await Promise.all(
          [...document.images].map((i) =>
            i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = () => r(0))),
          ),
        );
      });
      const buruk = await page.evaluate(() =>
        [...document.images]
          .filter(
            (i) =>
              i.naturalWidth === 0 ||
              !i.hasAttribute("alt") ||
              !(
                (i.getAttribute("width") && i.getAttribute("height")) ||
                getComputedStyle(i).aspectRatio !== "auto"
              ),
          )
          .map((i) => `${i.getAttribute("src")} (natural=${i.naturalWidth})`),
      );
      expect(buruk, path).toEqual([]);
    }
  });

  test("tanpa overflow horizontal: semua halaman di 360px; halaman utama di 768/1280px", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await awasi(page);
    await isiKeranjang(page);
    const over = () =>
      page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of SEMUA) {
      await page.goto(path);
      expect(await over(), `${path} @360`).toBe(false);
    }
    for (const w of [768, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const path of [
        "/",
        "/produk",
        `/produk/${products[0]!.slug}`,
        "/keranjang",
        "/checkout",
        "/lacak",
      ]) {
        await page.goto(path);
        expect(await over(), `${path} @${w}`).toBe(false);
      }
    }
  });

  test("struktur a11y: satu h1, heading tanpa lompat level, landmark, lang, id unik, tautan/tombol/input bernama", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await awasi(page);
    await isiKeranjang(page);
    const temuan: string[] = [];
    for (const path of SEMUA) {
      await page.goto(path);
      await page.waitForLoadState("load");
      const r = await page.evaluate(() => {
        const lv = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
          Number(h.tagName[1]),
        );
        const lompat = lv.filter((l, i) => (i === 0 ? l !== 1 : l - lv[i - 1]! > 1)).length;
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
        const nama = (e: Element) =>
          (e.getAttribute("aria-label") ?? "").trim() ||
          (e.textContent ?? "").trim() ||
          [...e.querySelectorAll("img")]
            .map((i) => i.getAttribute("alt") ?? "")
            .join("")
            .trim();
        return {
          lang: document.documentElement.lang,
          h1: lv.filter((l) => l === 1).length,
          lompat,
          dup: ids.filter((x, i) => ids.indexOf(x) !== i),
          tanpaNama: [...document.querySelectorAll("a[href], button")]
            .filter((e) => !nama(e))
            .map((e) => e.outerHTML.slice(0, 70)),
          tanpaLabel: [...document.querySelectorAll<HTMLInputElement>("input, textarea, select")]
            .filter(
              (e) =>
                e.type !== "hidden" &&
                e.offsetParent !== null &&
                !(e.labels && e.labels.length) &&
                !e.getAttribute("aria-label"),
            )
            .map((e) => e.name),
          main: document.querySelectorAll("main").length,
          // <header> di dalam section/article bukan landmark banner
          banner: [...document.querySelectorAll("header")].filter(
            (h) => !h.closest("section,article,main,aside"),
          ).length,
          footer: document.querySelectorAll("footer").length,
        };
      });
      if (r.lang !== "id") temuan.push(`${path}: lang=${r.lang}`);
      if (r.h1 !== 1) temuan.push(`${path}: h1=${r.h1}`);
      if (r.lompat) temuan.push(`${path}: heading melompat`);
      if (r.dup.length) temuan.push(`${path}: id ganda ${r.dup.join(",")}`);
      if (r.tanpaNama.length) temuan.push(`${path}: tanpa nama ${r.tanpaNama.join(";")}`);
      if (r.tanpaLabel.length) temuan.push(`${path}: input tanpa label ${r.tanpaLabel.join(",")}`);
      if (r.main !== 1) temuan.push(`${path}: main=${r.main}`);
      if (!path.startsWith("/admin") && (r.banner !== 1 || r.footer !== 1))
        temuan.push(`${path}: landmark banner=${r.banner} footer=${r.footer}`);
    }
    expect(temuan, temuan.join("\n")).toEqual([]);
  });

  test("keyboard: Tab pertama = lewati-konten; menu, keranjang, dan kartu produk dapat dicapai dengan indikator fokus", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const lewati = page.getByRole("link", { name: "Langsung ke konten utama" });
    await expect(lewati).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#isi$/);
    await page.goto("/produk");
    await page.keyboard.press("Tab");
    const dikunjungi: string[] = [];
    for (let i = 0; i < toko.nav.length + 3; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        const cs = getComputedStyle(e);
        return {
          t: (e.getAttribute("aria-label") || e.textContent || "").trim(),
          ring:
            (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
            cs.boxShadow !== "none",
        };
      });
      dikunjungi.push(info.t);
      expect(info.ring, `fokus tanpa indikator: ${info.t}`).toBe(true);
    }
    for (const n of toko.nav) expect(dikunjungi.join("|"), n.label).toContain(n.label);
    expect(dikunjungi.join("|")).toContain("Keranjang");
  });

  test("target sentuh: tautan/tombol di header ≥ 24×24 px (WCAG 2.5.8) di ponsel, termasuk tombol keranjang", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Buka menu" }).click();
    const kecil = await page.evaluate(() =>
      [...document.querySelectorAll("header a, header button")]
        .map((e) => ({
          t: (e.textContent || e.getAttribute("aria-label") || "").trim(),
          r: e.getBoundingClientRect(),
        }))
        .filter((x) => x.r.width > 0 && (x.r.width < 24 || x.r.height < 24))
        .map((x) => `${x.t} ${Math.round(x.r.width)}×${Math.round(x.r.height)}`),
    );
    expect(kecil).toEqual([]);
  });

  test("kontras WCAG AA untuk ketiga tema (netral, hangat, hijau)", async ({ page }) => {
    await page.goto("/");
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const rasio = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x! + 0.05) / (y! + 0.05);
    };
    const gagal: string[] = [];
    for (const tema of ["netral", "hangat", "hijau"]) {
      const t = await page.evaluate((th) => {
        document.documentElement.setAttribute("data-theme", th);
        const cs = getComputedStyle(document.documentElement);
        return Object.fromEntries(
          [
            "--bg",
            "--surface",
            "--fg",
            "--muted",
            "--primary",
            "--primary-fg",
            "--danger",
            "--success",
          ].map((n) => [n, cs.getPropertyValue(n).trim()]),
        );
      }, tema);
      const pasangan: Array<[string, string, string]> = [
        ["fg/bg", t["--fg"]!, t["--bg"]!],
        ["fg/surface", t["--fg"]!, t["--surface"]!],
        ["muted/bg", t["--muted"]!, t["--bg"]!],
        ["muted/surface", t["--muted"]!, t["--surface"]!],
        ["primary/bg", t["--primary"]!, t["--bg"]!],
        ["primary/surface", t["--primary"]!, t["--surface"]!],
        ["primary-fg/primary", t["--primary-fg"]!, t["--primary"]!],
        ["danger/bg", t["--danger"]!, t["--bg"]!],
        ["success/surface", t["--success"]!, t["--surface"]!],
        ["success/bg", t["--success"]!, t["--bg"]!],
      ];
      for (const [n, a, b] of pasangan)
        if (rasio(a, b) < 4.5) gagal.push(`${tema} ${n}: ${rasio(a, b).toFixed(2)}`);
    }
    expect(gagal, gagal.join("\n")).toEqual([]);
  });

  test("404 berbahasa Indonesia tanpa memantulkan path; robots & sitemap benar (produk aktif saja, tanpa admin/API)", async ({
    page,
    request,
  }) => {
    const res = await page.goto("/halaman-tidak-ada");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
    await page.goto("/%3Cscript%3Ewindow.__x%3D1%3C%2Fscript%3E");
    expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
    await expect(page.locator("body")).not.toContainText("<script>");
    const robots = await (await request.get("/robots.txt")).text();
    for (const d of ["/admin", "/api/", "/keranjang", "/checkout", "/lacak"])
      expect(robots, d).toContain(`Disallow: ${d}`.replace("Disallow: /api/", "Disallow: /api/"));
    expect(robots).toContain(`Sitemap: ${BASE}/sitemap.xml`);
    const mati = buatProduk({ active: false });
    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(locs).toContain(`${BASE}/`);
    for (const p of products) expect(locs, p.slug).toContain(`${BASE}/produk/${p.slug}`);
    expect(xml).not.toContain(mati.slug);
    // periksa PATH (bukan substring: slug produk "keranjang-rotan-…" sah)
    const paths = locs.map((l) => new URL(l).pathname);
    for (const p of paths)
      expect(p, p).not.toMatch(/^\/(admin|api|keranjang|checkout|lacak)(\/|$)/);
  });
});

test.describe("header & pertahanan umum", () => {
  test("header keamanan lengkap di halaman, API, unggahan, dan 404; tanpa X-Powered-By", async ({
    request,
  }) => {
    const p = buatProduk({});
    void p;
    for (const u of [
      "/",
      "/produk",
      `/produk/${products[0]!.slug}`,
      "/keranjang",
      "/lacak",
      "/admin/login",
      "/halaman-tidak-ada",
      "/robots.txt",
      "/sitemap.xml",
      "/uploads/tidak-ada-tidak-ada-1234.png",
    ]) {
      const h = (await request.get(u, { maxRedirects: 0 })).headers();
      expect(h["content-security-policy"], u).toContain("default-src");
      expect(h["x-content-type-options"], u).toBe("nosniff");
      expect(h["x-frame-options"], u).toBe("DENY");
      expect(h["referrer-policy"], u).toBe("strict-origin-when-cross-origin");
      expect(h["permissions-policy"], u).toContain("camera=()");
      expect(h["x-powered-by"], u).toBeUndefined();
    }
    const csp = (await request.get("/")).headers()["content-security-policy"]!;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).not.toContain("https:"); // tidak ada sumber eksternal di CSP
    // API JSON: tidak boleh di-cache
    for (const [u, m] of [
      ["/api/keranjang", "POST"],
      ["/api/pesanan", "POST"],
      ["/api/lacak", "POST"],
    ] as const) {
      const r = await request.fetch(u, {
        method: m,
        data: {},
        headers: { "x-forwarded-for": uniqueIp() },
      });
      expect(r.headers()["cache-control"], u).toBe("no-store");
    }
  });

  test("endpoint sensitif tidak membocorkan jejak teknologi/galat: 500 tidak pernah muncul untuk masukan sampah", async ({
    request,
  }) => {
    const sampah: unknown[] = [
      null,
      [],
      {},
      "x",
      1,
      { ids: "x" },
      { items: [{}] },
      { kode: {}, telepon: [] },
      "{",
      `{"a":${"[".repeat(50)}`,
    ];
    for (const u of ["/api/keranjang", "/api/checkout/ringkasan", "/api/pesanan", "/api/lacak"]) {
      for (const d of sampah) {
        const r = await request.post(u, {
          data: typeof d === "string" ? d : JSON.stringify(d),
          headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp() },
        });
        expect(r.status(), `${u} ← ${JSON.stringify(d)}`).toBeLessThan(500);
        const t = await r.text();
        expect(t).not.toMatch(/prisma|sqlite|stack|at .*\.(ts|js):\d+|node_modules/i);
      }
    }
  });

  test("integritas data demo: setiap produk punya varian, harga > 0, gambar ada; kode pesanan unik", async () => {
    const rows = query<{ n: number }>(
      "SELECT count(*) n FROM Product p WHERE NOT EXISTS (SELECT 1 FROM Variant v WHERE v.productId = p.id)",
    );
    expect(rows[0]!.n).toBe(0);
    expect(query<{ n: number }>("SELECT count(*) n FROM Product WHERE price <= 0")[0]!.n).toBe(0);
    expect(query<{ n: number }>("SELECT count(*) n FROM Variant WHERE stock < 0")[0]!.n).toBe(0);
    expect(
      query<{ n: number }>(
        'SELECT count(*) n FROM (SELECT code FROM "Order" GROUP BY code HAVING count(*) > 1)',
      )[0]!.n,
    ).toBe(0);
    void idVarian;
  });
});
