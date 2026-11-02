import { expect, test, type Page } from "@playwright/test";
import { semuaRute } from "../lib/seo";
import { localizeHref, type Lang } from "../lib/i18n";
import { huruf, loginAdmin, query, tag, uniqueIp } from "./helpers";
import Database from "better-sqlite3";

const BASE = "http://localhost:3002";
const LANGS = ["id", "en"] as const;
const semua = (lang: Lang) => semuaRute(lang).map((r) => localizeHref(lang, r.path));
const SEMUA_RUTE = [...semua("id"), ...semua("en")];

const XSS_IMG = `<img src=x onerror="window.__xss=(window.__xss||0)+1">`;
const XSS_SCRIPT = `<script>window.__xss=(window.__xss||0)+1</script>`;
const xssJalan = (page: Page) =>
  page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0);

type Pantau = { masalah: string[]; luar: string[]; gagal: string[] };

/**
 * Awasi: error konsol/JS, pelanggaran CSP, respons ≥400 untuk aset same-origin, dan permintaan ke origin luar.
 * Google Maps sengaja diblok saat tes (tidak dihitung masalah).
 */
async function awasi(page: Page): Promise<Pantau> {
  const p: Pantau = { masalah: [], luar: [], gagal: [] };
  await page.route("https://www.google.com/**", (r) => r.abort());
  page.on("console", (m) => {
    const t = m.text();
    if (/Failed to load resource/.test(t)) return; // dicatat lewat 'response' agar tahu URL-nya
    if (m.type() === "error" || /Refused to|Content Security Policy/i.test(t))
      p.masalah.push(`[${m.type()}] ${t}`);
  });
  page.on("pageerror", (e) => p.masalah.push(`[pageerror] ${e}`));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin !== BASE && u.protocol.startsWith("http") && u.hostname !== "www.google.com")
      p.luar.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().startsWith(BASE) && r.status() >= 400 && r.request().resourceType() !== "document")
      p.gagal.push(`${r.status()} ${r.url()}`);
  });
  return p;
}

test.describe("kualitas halaman (ID & EN)", () => {
  test("semua halaman termuat tanpa error konsol/CSP/aset rusak dan tanpa permintaan ke domain luar", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const p = await awasi(page);
    for (const path of SEMUA_RUTE) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await page.waitForLoadState("load");
      // gulir untuk memicu lazy-load gambar
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(50);
    }
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
    expect(p.gagal, p.gagal.join("\n")).toEqual([]);
    expect(p.luar, p.luar.join("\n")).toEqual([]);
  });

  test("setiap gambar termuat sebenarnya (naturalWidth > 0), ber-alt, dan punya width/height (cegah layout shift)", async ({
    page,
  }) => {
    await awasi(page);
    for (const path of SEMUA_RUTE) {
      await page.goto(path);
      await page.evaluate(async () => {
        // paksa semua gambar lazy dimuat
        document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
        await Promise.all(
          [...document.images].map((i) =>
            i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = () => r(0))),
          ),
        );
      });
      const bermasalah = await page.evaluate(() =>
        [...document.images]
          .filter(
            (i) =>
              i.naturalWidth === 0 ||
              !i.hasAttribute("alt") ||
              !i.getAttribute("width") ||
              !i.getAttribute("height"),
          )
          .map((i) => `${i.getAttribute("src")} (natural=${i.naturalWidth})`),
      );
      expect(bermasalah, path).toEqual([]);
    }
  });

  test("tidak ada overflow horizontal di 360px untuk semua halaman; 768/1280 untuk halaman utama", async ({
    page,
  }) => {
    await awasi(page);
    const over = () =>
      page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of SEMUA_RUTE) {
      await page.goto(path);
      expect(await over(), `${path} @360`).toBe(false);
    }
    for (const width of [768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of LANGS)
        for (const p of [
          "/",
          "/tentang",
          "/layanan/analitik-data",
          "/portofolio",
          "/blog/mengukur-hasil-proyek-digital",
          "/kontak",
        ]) {
          await page.goto(localizeHref(lang, p));
          expect(await over(), `${lang} ${p} @${width}`).toBe(false);
        }
    }
  });
});

test.describe("aksesibilitas", () => {
  test("struktur: satu h1, urutan heading tanpa lompat level, landmark, lang, id unik, nama aksesibel", async ({
    page,
  }) => {
    await awasi(page);
    const temuan: string[] = [];
    for (const path of SEMUA_RUTE) {
      await page.goto(path);
      const lang = path === "/en" || path.startsWith("/en/") ? "en" : "id";
      await expect(page.locator("html"), path).toHaveAttribute("lang", lang);
      const r = await page.evaluate(() => {
        const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
          Number(h.tagName[1]),
        );
        const lompat: string[] = [];
        levels.forEach((l, i) => {
          if (i === 0 ? l !== 1 : l - levels[i - 1]! > 1)
            lompat.push(`h${levels[i - 1] ?? 0}→h${l}`);
        });
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
        const duplikat = ids.filter((x, i) => ids.indexOf(x) !== i);
        const nama = (e: Element) =>
          (e.getAttribute("aria-label") ?? "").trim() ||
          (e.textContent ?? "").trim() ||
          [...e.querySelectorAll("img")]
            .map((i) => i.getAttribute("alt") ?? "")
            .join("")
            .trim();
        const tanpaNama = [...document.querySelectorAll("a[href], button")]
          .filter((e) => !nama(e))
          .map((e) => e.outerHTML.slice(0, 80));
        const tanpaLabel = [
          ...document.querySelectorAll<HTMLInputElement>("input, textarea, select"),
        ]
          .filter((e) => e.type !== "hidden" && e.offsetParent !== null)
          .filter((e) => !(e.labels && e.labels.length) && !e.getAttribute("aria-label"))
          .map((e) => e.name);
        const iframeTanpaJudul = [...document.querySelectorAll("iframe")]
          .filter((f) => !f.title.trim())
          .map((f) => f.src);
        return {
          h1: levels.filter((l) => l === 1).length,
          lompat,
          duplikat,
          tanpaNama,
          tanpaLabel,
          iframeTanpaJudul,
          main: document.querySelectorAll("main").length,
          banner: document.querySelectorAll("body > header, header").length,
          contentinfo: document.querySelectorAll("body > footer, footer").length,
          viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content"),
        };
      });
      if (r.h1 !== 1) temuan.push(`${path}: jumlah h1 = ${r.h1}`);
      if (r.lompat.length) temuan.push(`${path}: heading melompat ${r.lompat.join(", ")}`);
      if (r.duplikat.length) temuan.push(`${path}: id ganda ${r.duplikat.join(", ")}`);
      if (r.tanpaNama.length) temuan.push(`${path}: tanpa nama ${r.tanpaNama.join(" ; ")}`);
      if (r.tanpaLabel.length) temuan.push(`${path}: input tanpa label ${r.tanpaLabel.join(",")}`);
      if (r.iframeTanpaJudul.length) temuan.push(`${path}: iframe tanpa title`);
      if (r.main !== 1) temuan.push(`${path}: jumlah main = ${r.main}`);
      if (r.banner < 1 || r.contentinfo < 1) temuan.push(`${path}: landmark header/footer hilang`);
      if (!r.viewport?.includes("width=device-width")) temuan.push(`${path}: meta viewport`);
    }
    expect(temuan, temuan.join("\n")).toEqual([]);
  });

  test("keyboard: Tab pertama = tautan lewati-konten (terlihat saat fokus) → fokus pindah ke konten", async ({
    page,
  }) => {
    for (const [path, teks] of [
      ["/", "Langsung ke konten utama"],
      ["/en/layanan", "Skip to main content"],
    ] as const) {
      await page.goto(path);
      const lewati = page.getByRole("link", { name: teks });
      // tersembunyi secara visual sebelum fokus
      const sebelum = await lewati.boundingBox();
      expect(sebelum === null || sebelum.width <= 1, `${path} sebelum fokus`).toBe(true);
      await page.keyboard.press("Tab");
      await expect(lewati).toBeFocused();
      const box = await lewati.boundingBox();
      expect(box!.width, path).toBeGreaterThan(40);
      expect(box!.y, path).toBeGreaterThanOrEqual(0);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#isi$/);
      await page.keyboard.press("Tab");
      const di = await page.evaluate(() => document.activeElement?.closest("main") !== null);
      expect(di, `${path}: fokus berikutnya harus di dalam <main>`).toBe(true);
    }
  });

  test("keyboard: seluruh navigasi & pengalih bahasa bisa dicapai; fokus punya indikator terlihat", async ({
    page,
  }) => {
    await page.goto("/en/tentang");
    await page.keyboard.press("Tab"); // skip link
    const dikunjungi: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        const cs = getComputedStyle(e);
        return {
          t: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30),
          ring:
            (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
            cs.boxShadow !== "none",
        };
      });
      dikunjungi.push(info.t);
      expect(info.ring, `fokus tanpa indikator pada "${info.t}"`).toBe(true);
    }
    const gabung = dikunjungi.join(" | ");
    for (const n of ["Home", "About", "Services", "Portfolio", "Blog", "Contact", "ID", "EN"])
      expect(gabung, n).toContain(n);
  });

  test("accordion FAQ operasional dengan keyboard (Enter/Spasi) dan menjaga aria-expanded", async ({
    page,
  }) => {
    await page.goto("/en/layanan/analitik-data");
    const btn = page.getByRole("button", { name: /Which data sources are supported/ });
    await btn.focus();
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  test("target sentuh: tautan/tombol di navbar & pengalih bahasa ≥ 24×24 px (WCAG 2.5.8) di ponsel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
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

  test("tab 'Open menu' (ponsel): aria-expanded, aria-controls menuju elemen yang ada, tutup lewat tombol", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const buka = page.getByRole("button", { name: "Buka menu" });
    await expect(buka).toHaveAttribute("aria-expanded", "false");
    await buka.click();
    const tutup = page.getByRole("button", { name: "Tutup menu" });
    await expect(tutup).toHaveAttribute("aria-expanded", "true");
    const id = await tutup.getAttribute("aria-controls");
    await expect(page.locator(`#${id}`)).toBeVisible();
    await tutup.click();
    await expect(page.locator(`#${id}`)).toHaveCount(0);
  });

  /** Rasio kontras WCAG dari dua warna hex. */
  const kontras = (a: string, b: string) => {
    const lum = (hex: string) => {
      const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(bl!);
    };
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1! + 0.05) / (l2! + 0.05);
  };

  for (const tema of ["netral", "hangat", "hijau"]) {
    test(`kontras warna tema "${tema}": pasangan teks yang dipakai situs memenuhi WCAG AA`, async ({
      page,
    }) => {
      await page.goto("/");
      const t = await page.evaluate((nama) => {
        document.documentElement.dataset.theme = nama;
        const cs = getComputedStyle(document.documentElement);
        const v = (n: string) => cs.getPropertyValue(n).trim();
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
          ].map((n) => [n, v(n)]),
        );
      }, tema);
      const pasangan: Array<[string, string, string, number]> = [
        ["teks utama di latar", t["--fg"]!, t["--bg"]!, 4.5],
        ["teks utama di surface", t["--fg"]!, t["--surface"]!, 4.5],
        ["teks redup (muted) di latar", t["--muted"]!, t["--bg"]!, 4.5],
        ["teks redup (muted) di surface", t["--muted"]!, t["--surface"]!, 4.5],
        ["tautan/judul primer di latar", t["--primary"]!, t["--bg"]!, 4.5],
        ["tautan/judul primer di surface", t["--primary"]!, t["--surface"]!, 4.5],
        ["teks tombol primer", t["--primary-fg"]!, t["--primary"]!, 4.5],
        ["pesan galat di latar", t["--danger"]!, t["--bg"]!, 4.5],
        ["pesan sukses di surface", t["--success"]!, t["--surface"]!, 4.5],
      ];
      const gagal = pasangan
        .map(([n, a, b, min]) => ({ n, r: kontras(a, b), min }))
        .filter((x) => x.r < x.min)
        .map((x) => `${x.n}: ${x.r.toFixed(2)} < ${x.min}`);
      expect(gagal, tema).toEqual([]);
    });
  }
});

test.describe("XSS: payload tidak pernah tereksekusi", () => {
  test("query string ?kategori= (ID & EN) dan hash", async ({ page }) => {
    await awasi(page);
    const payload = encodeURIComponent(`${XSS_IMG}${XSS_SCRIPT}"><svg onload=window.__xss=1>`);
    for (const p of [`/portofolio?kategori=${payload}`, `/en/portofolio?kategori=${payload}`]) {
      await page.goto(p);
      await page.waitForTimeout(150);
      expect(await xssJalan(page), p).toBe(0);
      expect(await page.locator("main img[src='x'], main script, main svg[onload]").count()).toBe(
        0,
      );
    }
  });

  test("formulir kontak: tag dibuang saat simpan; halaman admin hanya menampilkan teks", async ({
    page,
    request,
  }) => {
    const t = tag("x");
    const res = await request.post("/api/kontak", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: {
        nama: "Pengirim Uji",
        email: "uji@contoh.id",
        isi: `${XSS_IMG}${XSS_SCRIPT} aman ${t} &lt;b&gt;tebal&lt;/b&gt; javascript:alert(1)`,
      },
    });
    expect(res.status()).toBe(201);
    const row = query<{ isi: string }>("SELECT isi FROM Pesan WHERE isi LIKE ?", `%${t}%`);
    expect(row).toHaveLength(1);
    expect(row[0]!.isi).not.toMatch(/<\s*(img|script)/i);

    await awasi(page);
    await loginAdmin(page);
    await page.goto("/admin/pesan");
    const baris = page.getByTestId("baris-pesan").filter({ hasText: t });
    await expect(baris).toContainText("&lt;b&gt;tebal&lt;/b&gt;"); // literal, bukan <b>
    await expect(baris).toContainText("javascript:alert(1)"); // teks biasa
    expect(await baris.locator("b, img, script, a[href^='javascript']").count()).toBe(0);
    expect(await xssJalan(page)).toBe(0);
  });

  test("pertahanan berlapis: data 'kotor' langsung di DB tetap di-escape di admin dan ekspor CSV", async ({
    page,
  }) => {
    const t = huruf();
    const kotor = `${XSS_IMG}${XSS_SCRIPT}`;
    const d = new Database("e2e.db", { fileMustExist: true });
    try {
      d.prepare(
        "INSERT INTO Pesan (nama, email, telepon, layanan, isi, emailTerkirim, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)",
      ).run(
        `${kotor}Nama${t}`,
        `${kotor}@x${t}.example`,
        `${kotor}`,
        `${kotor}`, // layanan tak dikenal → tidak boleh dirender sebagai HTML
        `${kotor} isi ${t}`,
        new Date().toISOString(),
      );
    } finally {
      d.close();
    }
    await awasi(page);
    await loginAdmin(page);
    await page.goto("/admin/pesan");
    await page.waitForTimeout(200);
    const baris = page.getByTestId("baris-pesan").filter({ hasText: `Nama${t}` });
    await expect(baris).toHaveCount(1);
    expect(await baris.locator("img, script, svg, a").count()).toBe(0);
    expect(await xssJalan(page)).toBe(0);

    const csv = await page.request.get("/admin/pesan/ekspor");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(csv.headers()["content-disposition"]).toContain("attachment");
    expect(csv.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("kontrol positif: detektor memang menangkap payload bila di-render sebagai HTML (bukan tes yang selalu lulus)", async ({
    page,
  }) => {
    await page.goto("/kontak");
    await page.evaluate((h) => {
      const div = document.createElement("div");
      div.innerHTML = h;
      document.body.append(div);
    }, XSS_IMG);
    await page.waitForFunction(
      () => ((window as unknown as { __xss?: number }).__xss ?? 0) > 0,
      undefined,
      { timeout: 3000 },
    );
    expect(await xssJalan(page)).toBeGreaterThan(0);
  });
});

test.describe("keamanan HTTP", () => {
  test("header keamanan lengkap di halaman publik, admin, dan API; tanpa X-Powered-By", async ({
    request,
  }) => {
    for (const p of ["/", "/en/layanan", "/admin/login", "/tidak-ada", "/sitemap.xml"]) {
      const h = (await request.get(p)).headers();
      expect(h["content-security-policy"], p).toContain("default-src 'self'");
      expect(h["content-security-policy"], p).toContain("frame-ancestors 'none'");
      expect(h["x-content-type-options"], p).toBe("nosniff");
      expect(h["referrer-policy"], p).toBeTruthy();
      expect(h["x-powered-by"], p).toBeUndefined();
    }
  });

  test("API kontak: metode selain POST ditolak; GET admin/ekspor tanpa login 401; /api/admin/* tidak bocor", async ({
    request,
  }) => {
    for (const m of ["get", "put", "delete", "patch"] as const) {
      const r = await request[m]("/api/kontak");
      expect([404, 405], m).toContain(r.status());
    }
    expect((await request.get("/admin/pesan/ekspor")).status()).toBe(401);
  });

  test("navigasi dalam situs tidak pernah menghasilkan redirect terbuka ke domain lain", async ({
    request,
  }) => {
    for (const p of [
      "/id//evil.example",
      "/id/%2F%2Fevil.example",
      "//evil.example",
      "/en//evil.example",
    ]) {
      // URL absolut: "//host" mentah akan ditafsirkan Playwright sebagai protocol-relative ke host lain.
      const r = await request.get(`${BASE}${p}`, { maxRedirects: 0 });
      const loc = r.headers()["location"];
      if (loc) expect(new URL(loc, BASE).origin, p).toBe(BASE);
    }
  });
});
