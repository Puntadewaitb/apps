import { expect, test, type Page } from "@playwright/test";
import { galleries, posts, programs } from "../prisma/seed-data";
import { sekolah } from "../content/sekolah";
import { EDITOR_EMAIL, EDITOR_PASSWORD, awasi, dbDate, huruf, login, tulis } from "./helpers";

const BASE = "http://localhost:3004";
const PUBLIK = [
  "/",
  "/profil",
  "/guru",
  "/program",
  "/berita",
  ...posts.filter((p) => p.daysAgo !== null).map((p) => `/berita/${p.slug}`),
  "/agenda",
  "/galeri",
  ...galleries.map((g) => `/galeri/${g.slug}`),
  "/ppdb",
  "/ppdb/daftar",
  "/ppdb/status",
  "/donasi",
  ...programs.map((p) => `/donasi/${p.slug}`),
];

test.describe("kualitas halaman publik", () => {
  test("semua halaman termuat (200) tanpa error konsol/CSP/aset rusak dan tanpa permintaan ke domain luar", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const p = await awasi(page);
    for (const path of [...PUBLIK, "/admin/login"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await page.waitForLoadState("load");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
    expect(p.gagal, p.gagal.join("\n")).toEqual([]);
    expect(p.luar, p.luar.join("\n")).toEqual([]);
  });

  test("gambar benar-benar termuat, ber-alt, dan punya width/height (cegah layout shift)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await awasi(page);
    for (const path of PUBLIK) {
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
              // CLS aman bila ada width+height ATAU rasio aspek CSS (thumbnail Lightbox memakai aspect-4/3)
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
    test.setTimeout(150_000);
    await awasi(page);
    const over = () =>
      page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of PUBLIK) {
      await page.goto(path);
      expect(await over(), `${path} @360`).toBe(false);
    }
    for (const w of [768, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      for (const path of ["/", "/profil", "/agenda", "/galeri", "/ppdb/daftar", "/donasi"]) {
        await page.goto(path);
        expect(await over(), `${path} @${w}`).toBe(false);
      }
    }
  });

  test("teks sangat panjang tanpa spasi (URL/data kotor) tidak membuat halaman meluber di 360px", async ({
    page,
  }) => {
    const t = huruf();
    const panjang = "x".repeat(140);
    tulis((d) => {
      d.prepare(
        "INSERT INTO Post (slug, kind, title, excerpt, body, image, published, publishedAt, createdAt, updatedAt) VALUES (?, 'BERITA', ?, ?, ?, '', 1, ?, ?, ?)",
      ).run(
        `uji-panjang-${t}`,
        `Judul ${panjang}`,
        `Ringkasan ${panjang} ${panjang}`,
        `Isi ${panjang}\n\n[tautan](https://contoh.example/${panjang})`,
        dbDate(Date.now() - 4000 * 86_400_000),
        dbDate(Date.now()),
        dbDate(Date.now()),
      );
      d.prepare(
        "INSERT INTO Agenda (title, description, location, startsAt, endsAt, createdAt) VALUES (?, ?, ?, ?, NULL, ?)",
      ).run(
        `Uji Panjang ${panjang}`,
        panjang,
        panjang,
        dbDate(new Date("2031-05-10T01:00:00Z")),
        dbDate(Date.now()),
      );
    });
    try {
      await page.setViewportSize({ width: 360, height: 800 });
      for (const path of ["/berita", `/berita/uji-panjang-${t}`, "/agenda?bulan=2031-05", "/"]) {
        await page.goto(path);
        const over = await page.evaluate(() => ({
          s: document.documentElement.scrollWidth,
          w: window.innerWidth,
        }));
        expect(over.s, `${path}: scrollWidth ${over.s} > ${over.w}`).toBeLessThanOrEqual(over.w);
      }
    } finally {
      tulis((d) => {
        d.prepare("DELETE FROM Post WHERE slug = ?").run(`uji-panjang-${t}`);
        d.prepare("DELETE FROM Agenda WHERE title LIKE 'Uji Panjang %'").run();
      });
    }
  });

  test("struktur a11y: satu h1, heading tanpa lompat level, landmark, lang, id unik, tautan/tombol/input bernama", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await awasi(page);
    const temuan: string[] = [];
    for (const path of [...PUBLIK, "/admin/login"]) {
      await page.goto(path);
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
          iframeTanpaJudul: [...document.querySelectorAll("iframe")].filter((f) => !f.title.trim())
            .length,
          main: document.querySelectorAll("main").length,
          header: document.querySelectorAll("header").length,
          footer: document.querySelectorAll("footer").length,
        };
      });
      if (r.lang !== "id") temuan.push(`${path}: lang=${r.lang}`);
      if (r.h1 !== 1) temuan.push(`${path}: h1=${r.h1}`);
      if (r.lompat) temuan.push(`${path}: heading melompat`);
      if (r.dup.length) temuan.push(`${path}: id ganda ${r.dup.join(",")}`);
      if (r.tanpaNama.length) temuan.push(`${path}: tanpa nama ${r.tanpaNama.join(";")}`);
      if (r.tanpaLabel.length) temuan.push(`${path}: input tanpa label ${r.tanpaLabel.join(",")}`);
      if (r.iframeTanpaJudul) temuan.push(`${path}: iframe tanpa title`);
      if (r.main !== 1) temuan.push(`${path}: main=${r.main}`);
      // halaman login admin sengaja polos (tanpa navbar/footer situs): cukup <main>
      if (!path.startsWith("/admin") && (r.header < 1 || r.footer < 1))
        temuan.push(`${path}: landmark header/footer`);
    }
    expect(temuan, temuan.join("\n")).toEqual([]);
  });

  test("keyboard: Tab pertama = lewati-konten; menu & wizard dapat dioperasikan; fokus terlihat", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const lewati = page.getByRole("link", { name: "Langsung ke konten utama" });
    await expect(lewati).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#isi$/);
    // semua tautan menu bisa dicapai & berindikator fokus
    await page.goto("/profil");
    await page.keyboard.press("Tab");
    const dikunjungi: string[] = [];
    for (let i = 0; i < sekolah.nav.length + 1; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        const cs = getComputedStyle(e);
        return {
          t: (e.textContent || "").trim(),
          ring:
            (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
            cs.boxShadow !== "none",
        };
      });
      dikunjungi.push(info.t);
      expect(info.ring, `fokus tanpa indikator: ${info.t}`).toBe(true);
    }
    for (const n of sekolah.nav) expect(dikunjungi.join("|"), n.label).toContain(n.label);
  });

  test("target sentuh: tautan/tombol di navbar ≥ 24×24 px (WCAG 2.5.8) di ponsel", async ({
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

  test("kontras WCAG AA untuk tema situs (pasangan teks yang dipakai)", async ({ page }) => {
    await page.goto("/");
    const t = await page.evaluate(() => {
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
    });
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const rasio = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x! + 0.05) / (y! + 0.05);
    };
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
    ];
    const gagal = pasangan
      .filter(([, a, b]) => rasio(a, b) < 4.5)
      .map(([n, a, b]) => `${n}: ${rasio(a, b).toFixed(2)}`);
    expect(gagal).toEqual([]);
  });

  test("404 publik berbahasa Indonesia dan sitemap/robots benar", async ({ page, request }) => {
    const res = await page.goto("/halaman-tidak-ada");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
    expect(robots).toMatch(/Disallow: \/api\//);
    expect(robots).toContain(`Sitemap: ${BASE}/sitemap.xml`);
    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    for (const p of PUBLIK.filter((x) => !["/ppdb/daftar", "/ppdb/status"].includes(x)))
      expect(locs, p).toContain(p === "/" ? BASE : `${BASE}${p}`);
    expect(xml).not.toMatch(/\/admin|\/api\//);
    // draf tidak masuk sitemap
    const draf = posts.find((p) => p.daysAgo === null)!;
    expect(xml).not.toContain(draf.slug);
  });
});

test.describe("otorisasi: matriks akses", () => {
  const HALAMAN_ADMIN = [
    "/admin",
    "/admin/berita",
    "/admin/berita/baru",
    "/admin/berita/1",
    "/admin/agenda",
    "/admin/agenda/baru",
    "/admin/agenda/1",
    "/admin/galeri",
    "/admin/galeri/baru",
    "/admin/galeri/1",
    "/admin/guru",
    "/admin/guru/baru",
    "/admin/guru/1",
    "/admin/ppdb",
    "/admin/ppdb/1",
    "/admin/donasi",
    "/admin/donasi/1",
    "/admin/donasi/program",
    "/admin/donasi/program/baru",
    "/admin/donasi/program/1",
  ];
  const BERKAS_ADMIN = [
    "/admin/ppdb/ekspor",
    "/admin/ppdb/dokumen/1/akta",
    "/admin/donasi/bukti/1",
  ];

  test("ANONIM: setiap halaman/route admin dialihkan ke login (tanpa data); API → 401 JSON", async ({
    request,
  }) => {
    for (const u of [...HALAMAN_ADMIN, ...BERKAS_ADMIN]) {
      const r = await request.get(u, { maxRedirects: 0 });
      expect(r.status(), u).toBe(307);
      expect(r.headers()["location"], u).toContain("/admin/login");
      expect((await r.text()).length, u).toBeLessThan(2000); // tak ada isi halaman
    }
    const api = await request.get("/api/admin/ringkasan", { maxRedirects: 0 });
    expect(api.status()).toBe(401);
    expect(await api.json()).toEqual({ error: "Belum login." });
  });

  test("ANONIM: metode tulis (POST/PUT/DELETE) ke route admin juga tidak lolos", async ({
    request,
  }) => {
    for (const m of ["post", "put", "delete", "patch"] as const) {
      for (const u of [
        "/admin/ppdb/ekspor",
        "/admin/donasi/bukti/1",
        "/api/admin/ringkasan",
        "/admin/berita",
      ]) {
        const r = await request[m](u, { maxRedirects: 0, data: {} });
        expect([307, 401, 403, 404, 405], `${m.toUpperCase()} ${u} → ${r.status()}`).toContain(
          r.status(),
        );
        expect(r.status(), `${m} ${u}`).not.toBe(200);
      }
    }
  });

  test("EDITOR: area konten boleh (200); PPDB & donasi ditolak (halaman → /admin?akses=ditolak, berkas/API → 403)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await login(p, EDITOR_EMAIL, EDITOR_PASSWORD);
    for (const u of [
      "/admin",
      "/admin/berita",
      "/admin/berita/baru",
      "/admin/agenda",
      "/admin/galeri",
      "/admin/guru",
    ]) {
      const r = await p.goto(u);
      expect(r?.status(), u).toBe(200);
      expect(p.url(), u).toBe(`${BASE}${u}`);
    }
    for (const u of [
      "/admin/ppdb",
      "/admin/ppdb/1",
      "/admin/donasi",
      "/admin/donasi/1",
      "/admin/donasi/program",
      "/admin/donasi/program/baru",
    ]) {
      await p.goto(u);
      await expect(p, u).toHaveURL(/\/admin\?akses=ditolak$/);
    }
    for (const u of BERKAS_ADMIN) expect((await p.request.get(u)).status(), u).toBe(403);
    await ctx.close();
  });

  test("ADMIN: semua halaman admin dapat dibuka tanpa error (200/404 untuk ID contoh yang tak ada, bukan 500)", async ({
    browser,
  }) => {
    test.setTimeout(90_000);
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const a = await awasi(p);
    await login(p);
    for (const u of HALAMAN_ADMIN) {
      const r = await p.goto(u);
      expect([200, 404], `${u} → ${r?.status()}`).toContain(r?.status());
    }
    expect(
      a.masalah.filter((m) => !/404/.test(m)),
      a.masalah.join("\n"),
    ).toEqual([]);
    await ctx.close();
  });

  test("header keamanan lengkap di halaman publik, admin, API, dan unggahan; tanpa X-Powered-By", async ({
    request,
  }) => {
    for (const p of [
      "/",
      "/ppdb/daftar",
      "/admin/login",
      "/api/admin/ringkasan",
      "/robots.txt",
      "/halaman-tidak-ada",
    ]) {
      const h = (await request.get(p, { maxRedirects: 0 })).headers();
      expect(h["content-security-policy"], p).toContain("default-src");
      expect(h["x-content-type-options"], p).toBe("nosniff");
      expect(h["x-powered-by"], p).toBeUndefined();
    }
    const csp = (await request.get("/")).headers()["content-security-policy"]!;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src https://www.google.com");
  });

  test("open redirect di login ditolak; sesi cookie HttpOnly+SameSite=Strict", async ({ page }) => {
    await login(page);
    const c = (await page.context().cookies()).find((x: { name: string }) =>
      x.name.includes("session-token"),
    )!;
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe("Strict");
  });
});

void (null as unknown as Page);
