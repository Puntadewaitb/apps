import { expect, test, type Page } from "@playwright/test";
import { blog } from "../content/blog.id";
import { konten } from "../content/id";
import { semuaArtikel } from "../lib/blog";

const layanan = konten.layanan;
const WIDTHS = [360, 768, 1280];

function pantau(page: Page) {
  const masalah: string[] = [];
  page.on("console", (m) => m.type() === "error" && masalah.push(m.text()));
  page.on("pageerror", (e) => masalah.push(String(e)));
  return masalah;
}

test.describe("navigasi", () => {
  test("menu utama mengarah ke Beranda, Tentang, Layanan; tautan aktif bekerja", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Navigasi utama" });
    for (const n of konten.nav)
      await expect(nav.getByRole("link", { name: n.label })).toHaveAttribute("href", n.href);
    await nav.getByRole("link", { name: "Tentang" }).click();
    await expect(page).toHaveURL(/\/tentang$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tentang Kami");
    await nav.getByRole("link", { name: "Layanan" }).click();
    await expect(page).toHaveURL(/\/layanan$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Layanan");
  });

  test("semua tautan internal dari seluruh halaman menghasilkan 200 (tanpa tautan mati)", async ({
    page,
    request,
  }) => {
    const antre = ["/"];
    const dikunjungi = new Set<string>();
    while (antre.length) {
      const path = antre.shift()!;
      if (dikunjungi.has(path)) continue;
      dikunjungi.add(path);
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((els) =>
          els
            .map((e) => e.getAttribute("href")!)
            .filter((h) => h.startsWith("/") && !h.startsWith("//")),
        );
      for (const h of hrefs) {
        const bersih = h.split("#")[0]!;
        if (bersih && !dikunjungi.has(bersih)) antre.push(bersih);
      }
      // anchor internal ke bagian di halaman yang sama harus ada
      const anchors = await page
        .locator('a[href^="#"]')
        .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!))]);
      for (const a of anchors)
        if (a !== "#") await expect(page.locator(a), `${path} ${a}`).toHaveCount(1);
    }
    // semua halaman inti + semua detail layanan terjangkau dari navigasi
    for (const p of [
      "/",
      "/tentang",
      "/layanan",
      "/portofolio",
      "/blog",
      "/kontak",
      ...layanan.map((l) => `/layanan/${l.slug}`),
      ...konten.portofolio.proyek.map((x) => `/portofolio/${x.slug}`),
      ...semuaArtikel().map((a) => `/blog/${a.slug}`),
      ...blog.kategori.map((k) => `/blog/kategori/${k.id}`),
    ]) {
      expect(dikunjungi, p).toContain(p);
    }
    void request;
  });
});

test.describe("beranda", () => {
  test("ringkasan layanan & keunggulan dari konten", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("kartu-layanan")).toHaveCount(layanan.length);
    for (const l of layanan) {
      await expect(page.getByRole("link", { name: `Lihat detail: ${l.nama}` })).toHaveAttribute(
        "href",
        `/layanan/${l.slug}`,
      );
    }
    await expect(page.locator("#keunggulan li")).toHaveCount(konten.keunggulan.butir.length);
    await expect(page.getByRole("link", { name: "Lihat semua layanan" })).toHaveAttribute(
      "href",
      "/layanan",
    );
  });
});

test.describe("halaman Tentang", () => {
  test("visi, misi, nilai, sejarah berurutan, dan tim", async ({ page }) => {
    const masalah = pantau(page);
    await page.goto("/tentang");
    await expect(page).toHaveTitle(`Tentang Kami | ${konten.perusahaan.nama}`);
    await expect(page.getByTestId("visi")).toHaveText(konten.tentang.visiMisi.visi);
    await expect(page.getByTestId("misi").locator("li")).toHaveCount(
      konten.tentang.visiMisi.misi.length,
    );
    await expect(page.locator("#nilai li")).toHaveCount(konten.tentang.nilai.length);
    await expect(page.getByTestId("peristiwa").locator("time")).toHaveText(
      konten.tentang.sejarah.peristiwa.map((p) => p.tahun),
    );
    const tim = page.getByTestId("anggota-tim");
    await expect(tim).toHaveCount(konten.tentang.tim.anggota.length);
    for (const a of konten.tentang.tim.anggota) {
      await expect(tim.filter({ hasText: a.nama })).toContainText(a.jabatan);
      await expect(page.getByRole("img", { name: `Foto ${a.nama}` })).toBeVisible();
    }
    for (const img of await page.locator("#tim img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }
    expect(masalah).toEqual([]);
  });
});

test.describe("halaman Layanan", () => {
  test("daftar menampilkan semua layanan dengan tautan ke detail", async ({ page }) => {
    await page.goto("/layanan");
    await expect(page).toHaveTitle(`Layanan | ${konten.perusahaan.nama}`);
    await expect(page.getByTestId("kartu-layanan")).toHaveCount(layanan.length);
    await page.getByRole("link", { name: `Lihat detail: ${layanan[1]!.nama}` }).click();
    await expect(page).toHaveURL(new RegExp(`/layanan/${layanan[1]!.slug}$`));
  });

  for (const l of layanan) {
    test(`detail ${l.slug}: judul, breadcrumb, manfaat, tahapan, hasil, terkait`, async ({
      page,
    }) => {
      const masalah = pantau(page);
      const res = await page.goto(`/layanan/${l.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(`${l.nama} | ${konten.perusahaan.nama}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", l.ringkas);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(l.nama);
      const bc = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(bc.getByRole("link", { name: "Beranda" })).toHaveAttribute("href", "/");
      await expect(bc.getByRole("link", { name: "Layanan" })).toHaveAttribute("href", "/layanan");
      await expect(bc.locator('[aria-current="page"]')).toHaveText(l.nama);
      await expect(page.locator("#manfaat li")).toHaveCount(l.manfaat.length);
      await expect(page.getByTestId("tahap")).toHaveCount(l.tahapan.length);
      await expect(page.locator("#hasil li")).toHaveCount(l.hasil.length);
      for (const slug of l.terkait) {
        await expect(page.locator("#terkait").locator(`a[href="/layanan/${slug}"]`)).toHaveCount(1);
      }
      expect(masalah).toEqual([]);
    });
  }

  test("FAQ accordion: satu terbuka dalam satu waktu", async ({ page }) => {
    const l = layanan[0]!;
    await page.goto(`/layanan/${l.slug}`);
    const a = page.getByRole("button", { name: l.faq[0]!.q });
    const b = page.getByRole("button", { name: l.faq[1]!.q });
    await a.click();
    await expect(a).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(l.faq[0]!.a)).toBeVisible();
    await b.click();
    await expect(a).toHaveAttribute("aria-expanded", "false");
    await expect(b).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(l.faq[0]!.a)).toBeHidden();
  });

  test("slug tidak dikenal → 404 Indonesia (tanpa render dinamis)", async ({ page }) => {
    for (const s of ["tidak-ada", "__proto__", "..%2Fetc", "KONSULTASI-PROSES-BISNIS"]) {
      const res = await page.goto(`/layanan/${s}`);
      expect(res?.status(), s).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
    }
  });
});

test("tidak ada overflow horizontal di semua halaman pada 360/768/1280", async ({ page }) => {
  const halaman = ["/", "/tentang", "/layanan", ...layanan.map((l) => `/layanan/${l.slug}`)];
  for (const width of WIDTHS) {
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

test("satu h1 & satu main di setiap halaman; judul halaman unik", async ({ page }) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  const halaman = [
    "/",
    "/tentang",
    "/layanan",
    "/portofolio",
    "/blog",
    "/kontak",
    ...layanan.map((l) => `/layanan/${l.slug}`),
    ...konten.portofolio.proyek.map((x) => `/portofolio/${x.slug}`),
    ...semuaArtikel().map((a) => `/blog/${a.slug}`),
    ...blog.kategori.map((k) => `/blog/kategori/${k.id}`),
  ];
  const judul = new Set<string>();
  for (const h of halaman) {
    await page.goto(h);
    await expect(page.locator("h1"), h).toHaveCount(1);
    await expect(page.locator("main"), h).toHaveCount(1);
    judul.add(await page.title());
  }
  expect(judul.size).toBe(halaman.length);
});
