import { expect, test, type Page } from "@playwright/test";
import { konten } from "../content/id";

const { portofolio, kredibilitas } = konten;
const kartu = (page: Page) => page.getByTestId("kartu-proyek");
const chip = (page: Page, nama: string) =>
  page
    .getByRole("navigation", { name: portofolio.filter.label })
    .getByRole("link", { name: nama, exact: true });

test.describe("daftar portofolio & filter kategori", () => {
  test("tanpa filter: semua proyek & chip 'Semua' aktif", async ({ page }) => {
    await page.goto("/portofolio");
    await expect(page).toHaveTitle(`${portofolio.judul} | ${konten.perusahaan.nama}`);
    await expect(kartu(page)).toHaveCount(portofolio.proyek.length);
    await expect(page.getByTestId("jumlah-proyek")).toHaveText(
      `${portofolio.proyek.length} proyek`,
    );
    await expect(chip(page, "Semua")).toHaveAttribute("aria-current", "true");
    for (const k of portofolio.kategori)
      await expect(chip(page, k.nama)).not.toHaveAttribute("aria-current", "true");
  });

  for (const k of portofolio.kategori) {
    const jumlah = portofolio.proyek.filter((p) => p.kategori === k.id).length;
    test(`filter "${k.nama}": ${jumlah} proyek, semuanya sesuai kategori`, async ({ page }) => {
      await page.goto("/portofolio");
      await chip(page, k.nama).click();
      await expect(page).toHaveURL(new RegExp(`/portofolio\\?kategori=${k.id}$`));
      await expect(kartu(page)).toHaveCount(jumlah);
      for (const c of await kartu(page).all())
        await expect(c).toHaveAttribute("data-kategori", k.id);
      await expect(page.getByTestId("jumlah-proyek")).toHaveText(`${jumlah} proyek`);
      await expect(chip(page, k.nama)).toHaveAttribute("aria-current", "true");
      await expect(chip(page, "Semua")).not.toHaveAttribute("aria-current", "true");
      // kembali ke semua
      await chip(page, "Semua").click();
      await expect(kartu(page)).toHaveCount(portofolio.proyek.length);
    });
  }

  test("nilai kategori tidak dikenal/berbahaya diabaikan (tampil semua, tanpa XSS)", async ({
    page,
  }) => {
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      void d.dismiss();
    });
    for (const q of [
      "xyz",
      "SISTEM",
      "__proto__",
      encodeURIComponent("<script>alert(1)</script>"),
      "sistem&kategori=data",
    ]) {
      const res = await page.goto(`/portofolio?kategori=${q}`);
      expect(res?.status(), q).toBe(200);
      const hitung = await kartu(page).count();
      expect(hitung, q).toBe(
        q === "sistem&kategori=data"
          ? portofolio.proyek.filter((p) => p.kategori === "sistem").length
          : portofolio.proyek.length,
      );
    }
    expect(dialog).toBe(false);
  });

  test("filter bekerja tanpa JavaScript (berbasis URL)", async ({ browser }) => {
    const ctx = await browser.newContext({
      javaScriptEnabled: false,
      baseURL: "http://localhost:3002",
    });
    const page = await ctx.newPage();
    await page.goto("/portofolio?kategori=data");
    const jumlah = portofolio.proyek.filter((p) => p.kategori === "data").length;
    await expect(kartu(page)).toHaveCount(jumlah);
    await ctx.close();
  });

  test("gambar proyek termuat & ber-alt", async ({ page }) => {
    await page.goto("/portofolio");
    for (const img of await page.locator("#proyek img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveAttribute("alt", /Ilustrasi proyek/);
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }
    await expect(page.locator("body")).toContainText("fiktif"); // catatan demo
  });
});

test.describe("detail proyek", () => {
  for (const p of portofolio.proyek) {
    test(`${p.slug}: isi lengkap & tautan konsisten`, async ({ page }) => {
      const res = await page.goto(`/portofolio/${p.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(`${p.judul} — ${p.klien} | ${konten.perusahaan.nama}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.judul);
      await expect(page.getByTestId("klien")).toHaveText(p.klien);
      await expect(page.getByText(p.tantangan)).toBeVisible();
      await expect(page.getByText(p.solusi)).toBeVisible();
      await expect(page.locator("#hasil li")).toHaveCount(p.hasil.length);
      const kat = portofolio.kategori.find((k) => k.id === p.kategori)!;
      await expect(
        page
          .locator("main")
          .getByRole("link", { name: konten.layanan.find((l) => l.slug === kat.layanan)!.nama }),
      ).toHaveAttribute("href", `/layanan/${kat.layanan}`);
      const bc = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(bc.getByRole("link", { name: portofolio.judul })).toHaveAttribute(
        "href",
        "/portofolio",
      );
      await expect(bc.locator('[aria-current="page"]')).toHaveText(p.judul);
      // proyek serupa: kategori sama, bukan dirinya
      for (const c of await page.locator("#serupa [data-testid=kartu-proyek]").all()) {
        await expect(c).toHaveAttribute("data-kategori", p.kategori);
        await expect(c).not.toContainText(p.judul);
      }
    });
  }

  test("slug tidak dikenal → 404", async ({ page }) => {
    for (const s of ["tidak-ada", "__proto__", "STANDARISASI-PERGUDANGAN-NUSA"]) {
      expect((await page.goto(`/portofolio/${s}`))?.status(), s).toBe(404);
    }
  });
});

test.describe("kredibilitas di beranda", () => {
  test("angka pencapaian", async ({ page }) => {
    await page.goto("/");
    const angka = page.getByTestId("angka");
    for (const b of kredibilitas.angka.butir) {
      await expect(angka).toContainText(b.nilai);
      await expect(angka).toContainText(b.label);
    }
  });

  test("logo klien/partner: semua termuat, ber-alt placeholder", async ({ page }) => {
    await page.goto("/");
    const logos = page.getByTestId("logo-klien").locator("img");
    await expect(logos).toHaveCount(kredibilitas.klien.daftar.length);
    for (const img of await logos.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveAttribute("alt", /^Logo .+ \(placeholder\)$/);
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }
  });

  test("testimoni: isi, jabatan, peringkat aksesibel, catatan fiktif", async ({ page }) => {
    await page.goto("/");
    const t = page.getByTestId("testimoni");
    await expect(t).toHaveCount(kredibilitas.testimoni.daftar.length);
    for (const x of kredibilitas.testimoni.daftar) {
      const kartuT = t.filter({ hasText: x.nama });
      await expect(kartuT).toContainText(x.teks);
      await expect(kartuT).toContainText(`${x.jabatan}, ${x.perusahaan}`);
      await expect(kartuT.getByRole("img", { name: `Penilaian ${x.rating} dari 5` })).toBeVisible();
    }
    await expect(page.locator("#testimoni")).toContainText("fiktif");
  });

  test("proyek pilihan di beranda tertaut ke detail", async ({ page }) => {
    await page.goto("/");
    const kartuHome = page.locator("#portofolio").getByTestId("kartu-proyek");
    await expect(kartuHome).toHaveCount(3);
    for (const p of portofolio.proyek.slice(0, 3)) {
      await expect(page.getByRole("link", { name: `Lihat proyek: ${p.judul}` })).toHaveAttribute(
        "href",
        `/portofolio/${p.slug}`,
      );
    }
    await expect(page.getByRole("link", { name: "Lihat semua proyek" })).toHaveAttribute(
      "href",
      "/portofolio",
    );
  });
});

test("menu utama memuat Portofolio & halaman baru tanpa overflow di 360/768/1280", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page
      .getByRole("navigation", { name: "Navigasi utama" })
      .getByRole("link", { name: "Portofolio" }),
  ).toHaveAttribute("href", "/portofolio");
  const halaman = [
    "/",
    "/portofolio",
    "/portofolio?kategori=sistem",
    ...portofolio.proyek.map((p) => `/portofolio/${p.slug}`),
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
