import { expect, test, type Page } from "@playwright/test";
import { blog } from "../content/blog.id";
import { konten } from "../content/id";
import { formatTanggalBlog, semuaArtikel } from "../lib/blog";
import { parseMarkdown } from "../lib/markdown";

const artikel = semuaArtikel();
const kartu = (page: Page) => page.getByTestId("kartu-artikel");
const chip = (page: Page, nama: string) =>
  page
    .getByRole("navigation", { name: blog.filterLabel })
    .getByRole("link", { name: nama, exact: true });

test.describe("daftar blog & kategori", () => {
  test("semua artikel terbaru dulu, dengan tanggal, penulis, dan waktu baca", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(`${blog.judul} | ${konten.perusahaan.nama}`);
    await expect(kartu(page)).toHaveCount(artikel.length);
    await expect(kartu(page).locator("h3")).toHaveText(artikel.map((a) => a.judul));
    const pertama = kartu(page).first();
    await expect(pertama).toContainText(formatTanggalBlog(artikel[0]!.tanggal));
    await expect(pertama).toContainText(artikel[0]!.penulis);
    await expect(pertama).toContainText(`${artikel[0]!.bacaMenit} ${blog.bacaLabel}`);
    await expect(chip(page, "Semua")).toHaveAttribute("aria-current", "true");
  });

  for (const k of blog.kategori) {
    const isi = artikel.filter((a) => a.kategori === k.id);
    test(`kategori "${k.nama}": ${isi.length} artikel`, async ({ page }) => {
      await page.goto("/blog");
      await chip(page, k.nama).click();
      await expect(page).toHaveURL(new RegExp(`/blog/kategori/${k.id}$`));
      await expect(page).toHaveTitle(`${k.nama} — ${blog.judul} | ${konten.perusahaan.nama}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(k.nama);
      await expect(kartu(page)).toHaveCount(isi.length);
      for (const c of await kartu(page).all())
        await expect(c).toHaveAttribute("data-kategori", k.id);
      await expect(chip(page, k.nama)).toHaveAttribute("aria-current", "true");
    });
  }

  test("kategori tak dikenal / indeks kategori → 404", async ({ page }) => {
    for (const p of [
      "/blog/kategori/xyz",
      "/blog/kategori/TIPS",
      "/blog/kategori/__proto__",
      "/blog/kategori",
    ]) {
      expect((await page.goto(p))?.status(), p).toBe(404);
    }
  });
});

test.describe("artikel", () => {
  for (const a of artikel) {
    test(`${a.slug}: metadata, isi Markdown ter-render, tautan valid`, async ({ page }) => {
      const masalah: string[] = [];
      page.on("console", (m) => m.type() === "error" && masalah.push(m.text()));
      page.on("pageerror", (e) => masalah.push(String(e)));

      const res = await page.goto(`/blog/${a.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(`${a.judul} | ${konten.perusahaan.nama}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", a.ringkas);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(a.judul);
      await expect(page.getByTestId("meta-artikel")).toContainText(a.penulis);
      await expect(page.getByTestId("meta-artikel")).toContainText(formatTanggalBlog(a.tanggal));
      await expect(page.locator("article time")).toHaveAttribute("datetime", a.tanggal);

      // jumlah heading/daftar/kutipan sesuai isi Markdown
      const blok = parseMarkdown(a.isi);
      const jumlah = (t: string, level?: number) =>
        blok.filter(
          (b) => b.t === t && (level === undefined || (b as { level?: number }).level === level),
        ).length;
      await expect(page.getByTestId("isi-artikel").locator("h2")).toHaveCount(jumlah("heading", 2));
      await expect(page.getByTestId("isi-artikel").locator("h3")).toHaveCount(jumlah("heading", 3));
      await expect(page.getByTestId("isi-artikel").locator("blockquote")).toHaveCount(
        jumlah("quote"),
      );
      await expect(page.getByTestId("isi-artikel").locator("ul, ol")).toHaveCount(
        jumlah("ul") + jumlah("ol"),
      );

      // aman: tanpa skrip/iframe/inline-handler dari isi artikel
      expect(
        await page
          .locator("article script, article iframe, article [onclick], article [onerror]")
          .count(),
      ).toBe(0);
      for (const l of await page.locator('article a[href^="https://"]').all()) {
        await expect(l).toHaveAttribute("rel", "noopener noreferrer");
      }
      // tautan internal di dalam isi → halaman ada
      const hrefs = await page
        .locator("article a[href^='/']")
        .evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
      for (const h of hrefs)
        expect((await page.request.get(h)).status(), `${a.slug} → ${h}`).toBe(200);
      expect(masalah).toEqual([]);
    });
  }

  test("breadcrumb & artikel terkait (kategori sama)", async ({ page }) => {
    const a = artikel.find((x) => artikel.filter((y) => y.kategori === x.kategori).length > 1)!;
    await page.goto(`/blog/${a.slug}`);
    const bc = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(bc.getByRole("link", { name: blog.judul })).toHaveAttribute("href", "/blog");
    await expect(
      bc.getByRole("link", { name: blog.kategori.find((k) => k.id === a.kategori)!.nama }),
    ).toHaveAttribute("href", `/blog/kategori/${a.kategori}`);
    await expect(bc.locator('[aria-current="page"]')).toHaveText(a.judul);
    for (const c of await page.locator("#terkait [data-testid=kartu-artikel]").all()) {
      await expect(c).toHaveAttribute("data-kategori", a.kategori);
      await expect(c).not.toContainText(a.judul);
    }
  });

  test("slug tak dikenal → 404 Indonesia", async ({ page }) => {
    for (const s of ["tidak-ada", "__proto__", "KATEGORI", "kategori"]) {
      const res = await page.goto(`/blog/${s}`);
      expect(res?.status(), s).toBe(404);
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
  });
});

test("blog & kontak: tanpa overflow di 360/768/1280", async ({ page }) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  const halaman = [
    "/blog",
    "/kontak",
    ...blog.kategori.map((k) => `/blog/kategori/${k.id}`),
    ...artikel.map((a) => `/blog/${a.slug}`),
  ];
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const h of halaman) {
      await page.goto(h);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(over, `${h} @${width}px`).toBe(false);
    }
  }
});
