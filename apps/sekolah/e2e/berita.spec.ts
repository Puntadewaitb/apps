import { expect, test } from "@playwright/test";
import { posts } from "../prisma/seed-data";
import { awasi, dbDate, huruf, query, tulis } from "./helpers";

const terbit = posts.filter((p) => p.daysAgo !== null).sort((a, b) => a.daysAgo! - b.daysAgo!);
const judulTerbit = terbit.map((p) => p.title);
const draf = posts.find((p) => p.daysAgo === null)!;
const kartu = (page: import("@playwright/test").Page) => page.getByTestId("kartu-berita");

/** Sisipkan tulisan uji (slug berawalan "uji-" agar tak mengganggu hitungan data seed). */
function sisip(o: {
  slug: string;
  title: string;
  body: string;
  kind?: string;
  published?: boolean;
  offsetHari: number;
}) {
  tulis((d) =>
    d
      .prepare(
        "INSERT INTO Post (slug, kind, title, excerpt, body, image, published, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)",
      )
      .run(
        o.slug,
        o.kind ?? "BERITA",
        o.title,
        `Ringkasan uji ${o.slug}`,
        o.body,
        o.published === false ? 0 : 1,
        dbDate(Date.now() + o.offsetHari * 86_400_000),
        dbDate(Date.now()),
        dbDate(Date.now()),
      ),
  );
}

test.describe("daftar berita", () => {
  test("hanya yang terbit, terbaru dulu; draf tidak tampil; ada tanggal & jenis", async ({
    page,
  }) => {
    await page.goto("/berita");
    await expect(page).toHaveTitle("Berita & Pengumuman | Sekolah Cendekia Nusantara");
    // abaikan tulisan uji "uji-*" milik tes lain: bandingkan hanya judul data seed, tetap berurutan
    const tampil = (await kartu(page).locator("h2").allTextContents()).filter((t) =>
      judulTerbit.includes(t),
    );
    expect(tampil).toEqual(judulTerbit);
    await expect(page.locator("body")).not.toContainText(draf.title);
    const pertama = kartu(page).first();
    await expect(pertama.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d\d-\d\dT/);
    await expect(pertama.getByText(/^(Berita|Pengumuman)$/)).toBeVisible();
  });

  test("filter jenis berbasis URL (jalan tanpa JavaScript); nilai aneh diabaikan tanpa XSS", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      await page.goto("/berita?jenis=pengumuman");
      const kind = await kartu(page).evaluateAll((els) =>
        els.map((e) => e.getAttribute("data-kind")),
      );
      expect(kind.length).toBeGreaterThanOrEqual(2);
      expect(new Set(kind)).toEqual(new Set(["PENGUMUMAN"]));
      await expect(page.getByRole("link", { name: "Pengumuman", exact: true })).toHaveAttribute(
        "aria-current",
        "true",
      );

      await page.goto("/berita?jenis=berita");
      const k2 = await kartu(page).evaluateAll((els) =>
        els.map((e) => e.getAttribute("data-kind")),
      );
      expect(new Set(k2)).toEqual(new Set(["BERITA"]));

      for (const v of [
        "semua",
        "'; DROP TABLE Post;--",
        encodeURIComponent("<script>window.__x=1</script>"),
        "__proto__",
      ]) {
        const res = await page.goto(`/berita?jenis=${v}&halaman=${v}`);
        expect(res?.status(), v).toBe(200);
        await expect(page.getByRole("link", { name: "Semua", exact: true }), v).toHaveAttribute(
          "aria-current",
          "true",
        );
        expect(await kartu(page).count(), v).toBeGreaterThanOrEqual(judulTerbit.length);
      }
    } finally {
      await ctx.close();
    }
  });

  test("halaman di luar rentang dipepatkan ke halaman terakhir (tidak error/kosong)", async ({
    page,
  }) => {
    for (const h of ["999", "0", "-5", "abc"]) {
      const res = await page.goto(`/berita?halaman=${h}`);
      expect(res?.status(), h).toBe(200);
      expect(await kartu(page).count(), h).toBeGreaterThan(0);
    }
  });

  test("tulisan terjadwal (tanggal terbit di masa depan) tidak tampil di daftar maupun detail", async ({
    page,
  }) => {
    const t = huruf();
    sisip({
      slug: `uji-terjadwal-${t}`,
      title: `Tulisan Terjadwal ${t}`,
      body: "Belum boleh tampil ke publik.",
      offsetHari: 30,
    });
    await page.goto("/berita");
    await expect(page.locator("body")).not.toContainText(`Tulisan Terjadwal ${t}`);
    const res = await page.goto(`/berita/uji-terjadwal-${t}`);
    expect(res?.status()).toBe(404);
  });
});

test.describe("detail berita", () => {
  test("isi lengkap: judul, penulis, tanggal, Markdown (judul/daftar), breadcrumb, terkait", async ({
    page,
  }) => {
    const p = terbit.find((x) => x.slug === "penerimaan-peserta-didik-baru-2027")!;
    await page.goto(`/berita/${p.slug}`);
    await expect(page).toHaveTitle(`${p.title} | Sekolah Cendekia Nusantara`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.title);
    await expect(page.getByTestId("meta-berita")).toContainText("Admin Sekolah");
    await expect(page.getByTestId("meta-berita").locator("time")).toHaveAttribute(
      "datetime",
      /^\d{4}-/,
    );
    const isi = page.getByTestId("isi-artikel");
    await expect(isi.locator("h2")).toHaveText(["Jadwal", "Persyaratan"]);
    await expect(isi.locator("ul li")).toHaveCount(2);
    await expect(isi.locator("ol li")).toHaveCount(3);
    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByRole("link", { name: "Berita & Pengumuman" }),
    ).toHaveAttribute("href", "/berita");
    // terkait: jenis sama (PENGUMUMAN), bukan dirinya sendiri
    const terkait = page.locator("#terkait");
    await expect(terkait).toContainText("Pengumuman lainnya");
    await expect(terkait.getByTestId("kartu-berita")).not.toContainText(p.title);
    const kinds = await terkait
      .getByTestId("kartu-berita")
      .evaluateAll((e) => e.map((x) => x.getAttribute("data-kind")));
    expect(new Set(kinds)).toEqual(new Set(["PENGUMUMAN"]));
  });

  test("metadata: Open Graph article + published_time; heading tanpa lompat level", async ({
    page,
  }) => {
    await page.goto("/berita/juara-olimpiade-sains-kabupaten");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      /^\d{4}-/,
    );
    const lv = await page.evaluate(() =>
      [...document.querySelectorAll("h1,h2,h3,h4")].map((e) => Number(e.tagName[1])),
    );
    expect(lv.filter((l, i) => (i === 0 ? l !== 1 : l - lv[i - 1]! > 1))).toEqual([]);
  });

  test("draf, slug tidak dikenal, dan slug berbahaya → 404", async ({ page }) => {
    for (const s of [
      draf.slug,
      "tidak-ada",
      "__proto__",
      "..%2Fetc",
      "JUARA-OLIMPIADE-SAINS-KABUPATEN",
      "x'%20OR%20'1'='1",
    ]) {
      const res = await page.goto(`/berita/${s}`);
      expect(res?.status(), s).toBe(404);
      await expect(page.getByRole("heading", { level: 1 }), s).toHaveText(
        "Halaman tidak ditemukan",
      );
    }
  });

  test("XSS: HTML mentah di isi/judul (data kotor langsung di DB) tampil sebagai teks; tautan javascript: dibuang", async ({
    page,
  }) => {
    const t = huruf();
    const kotor = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
    sisip({
      slug: `uji-xss-${t}`,
      title: `Judul ${kotor} ${t}`,
      body: `${kotor}\n\n[klik](javascript:window.__xss=1) dan [aman](/berita) dan **tebal**`,
      offsetHari: -400,
    });
    const p = await awasi(page);
    await page.goto(`/berita/uji-xss-${t}`);
    const isi = page.getByTestId("isi-artikel");
    await expect(isi).toContainText("<script>");
    expect(await isi.locator("img, script, iframe").count()).toBe(0);
    expect(await isi.locator("a[href^='javascript']").count()).toBe(0);
    await expect(isi.getByRole("link", { name: "aman" })).toHaveAttribute("href", "/berita");
    await expect(isi.locator("strong")).toHaveText("tebal");
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(0);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
    // daftar juga aman
    await page.goto("/berita?halaman=999");
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(0);
    expect(
      query<{ c: number }>("SELECT count(*) c FROM Post WHERE slug = ?", `uji-xss-${t}`)[0]!.c,
    ).toBe(1);
  });
});
