import { expect, test, type Page } from "@playwright/test";
import { angka, awasi, buatProduk, huruf, query } from "./helpers";

const hargaKartu = async (page: Page) =>
  (await page.getByTestId("kartu-produk").locator('[data-testid="harga"]').allTextContents()).map(
    angka,
  );
const judulKartu = (page: Page) =>
  page.getByTestId("kartu-produk").getByRole("heading").allTextContents();

test.describe("daftar produk", () => {
  test("12 kartu per halaman; paginasi berfungsi; halaman di luar rentang dijepit", async ({
    page,
  }) => {
    const total = query<{ c: number }>("SELECT count(*) c FROM Product WHERE active = 1")[0]!.c;
    expect(total).toBeGreaterThan(12); // seed (20) cukup untuk 2 halaman
    const res = await page.goto("/produk");
    expect(res?.status()).toBe(200);
    await expect(page.getByTestId("kartu-produk")).toHaveCount(12);
    const nav = page.getByRole("navigation", { name: "Halaman katalog" });
    await expect(nav.getByRole("link", { name: "Halaman 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Sebelumnya" })).toHaveCount(0);
    await nav.getByRole("link", { name: "Berikutnya" }).click();
    await expect(page).toHaveURL(/halaman=2/);
    await expect(nav.getByRole("link", { name: "Halaman 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await page.getByTestId("kartu-produk").count()).toBeGreaterThan(0);
    // halaman 1 dan 2 tidak boleh berisi produk yang sama
    const h2 = await judulKartu(page);
    await page.goto("/produk");
    const h1 = await judulKartu(page);
    expect(h1.filter((x) => h2.includes(x))).toEqual([]);
    // nilai aneh → tidak error
    for (const v of ["99999", "0", "-1", "abc", "1.5", "1e3", "%00"]) {
      const r = await page.goto(`/produk?halaman=${v}`);
      expect(r?.status(), v).toBe(200);
      await expect(page.getByTestId("kartu-produk").first()).toBeVisible();
    }
    await page.goto("/produk?halaman=99999");
    const terakhir = page
      .getByRole("navigation", { name: "Halaman katalog" })
      .locator('[aria-current="page"]');
    await expect(terakhir).toHaveText(String(Math.ceil(total / 12)));
  });

  test("filter kategori: semua kartu berkategori itu; h1 = nama kategori; slug tak dikenal → semua produk", async ({
    page,
  }) => {
    await page.goto("/produk?kategori=kopi-teh");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kopi & Teh");
    const n = query<{ c: number }>(
      "SELECT count(*) c FROM Product p JOIN Category c ON c.id = p.categoryId WHERE p.active = 1 AND c.slug = 'kopi-teh'",
    )[0]!.c;
    const kartu = page.getByTestId("kartu-produk");
    await expect(kartu).toHaveCount(Math.min(n, 12));
    for (const k of await kartu.all()) await expect(k).toContainText("Kopi & Teh");
    // kontrol positif: kategori lain memang berisi produk berbeda
    await page.goto("/produk?kategori=batik-kain");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Batik & Kain");
    for (const k of await page.getByTestId("kartu-produk").all())
      await expect(k).toContainText("Batik & Kain");
    const res = await page.goto("/produk?kategori=tidak-ada");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semua Produk");
    const res2 = await page.goto("/produk?kategori=%27%20OR%201%3D1--");
    expect(res2?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semua Produk");
  });

  test("pencarian: cocok nama/deskripsi tanpa membedakan huruf besar-kecil; tanpa hasil → keadaan kosong", async ({
    page,
  }) => {
    await page.goto("/produk?q=KOPI");
    const judul = await judulKartu(page);
    expect(judul.length).toBeGreaterThan(0);
    for (const j of judul) expect(j.toLowerCase()).toContain("kopi");
    await page.goto(`/produk?q=${huruf()}zzzz`);
    await expect(page.getByTestId("kosong")).toBeVisible();
    await expect(page.getByTestId("kartu-produk")).toHaveCount(0);
    await expect(page.getByTestId("jumlah-hasil")).toHaveText("Tidak ada produk yang cocok.");
    // kontrol: wildcard LIKE diperlakukan sebagai teks biasa, bukan "cocok semua"
    for (const w of ["%", "_", "%%", "\\"]) {
      await page.goto(`/produk?q=${encodeURIComponent(w)}`);
      await expect(page.getByTestId("kartu-produk"), w).toHaveCount(0);
    }
  });

  test("input q berbahaya: tidak dieksekusi, tidak merusak halaman, tidak ada tag di DOM", async ({
    page,
  }) => {
    let dialog = false;
    page.on("dialog", async (d) => {
      dialog = true;
      await d.dismiss();
    });
    for (const q of [
      "<script>alert(1)</script>",
      '"><img src=x onerror=alert(1)>',
      "'; DROP TABLE Product;--",
      "{{7*7}}${7*7}",
    ]) {
      const res = await page.goto(`/produk?q=${encodeURIComponent(q)}`);
      expect(res?.status(), q).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.locator("main script, main img[src='x']").count()).toBe(0);
    }
    expect(dialog).toBe(false);
    expect(query<{ c: number }>("SELECT count(*) c FROM Product")[0]!.c).toBeGreaterThan(0);
    // q sangat panjang dipotong
    await page.goto(`/produk?q=${"a".repeat(5000)}`);
    expect(await page.getByLabel("Cari produk").inputValue()).toHaveLength(60);
  });

  test("urutan harga: termurah naik, termahal turun; nama A–Z", async ({ page }) => {
    await page.goto("/produk?urut=termurah");
    const naik = await hargaKartu(page);
    expect(naik.length).toBeGreaterThan(5);
    expect(naik).toEqual([...naik].sort((a, b) => a - b));
    await page.goto("/produk?urut=termahal");
    const turun = await hargaKartu(page);
    expect(turun).toEqual([...turun].sort((a, b) => b - a));
    expect(turun[0]).toBeGreaterThan(naik[0]!); // kontrol: urutan memang berbeda
    await page.goto("/produk?urut=nama");
    const nama = await judulKartu(page);
    expect(nama).toEqual(
      [...nama].sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" })),
    );
    // urut tidak sah → bawaan, tidak error
    expect((await page.goto("/produk?urut=harga;drop"))?.status()).toBe(200);
  });

  test("form filter (tanpa JS) mengirim GET dan mempertahankan nilai", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/produk");
    await page.getByLabel("Cari produk").fill("kopi");
    await page.getByLabel("Kategori").selectOption("kopi-teh");
    await page.getByLabel("Urutkan").selectOption("termurah");
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page).toHaveURL(/\/produk\?q=kopi&kategori=kopi-teh&urut=termurah$/);
    await expect(page.getByLabel("Cari produk")).toHaveValue("kopi");
    await expect(page.getByLabel("Kategori")).toHaveValue("kopi-teh");
    await expect(page.getByLabel("Urutkan")).toHaveValue("termurah");
    await page.getByRole("link", { name: "Reset" }).click();
    await expect(page).toHaveURL(/\/produk$/);
    await ctx.close();
  });
});

test.describe("produk nonaktif & stok", () => {
  test("produk nonaktif tidak publik: tidak di daftar, pencarian, beranda, sitemap; detailnya 404", async ({
    page,
    request,
  }) => {
    const nama = `Rahasia ${huruf()}`;
    const p = buatProduk({ name: nama, active: false });
    const aktifNama = `Terlihat ${huruf()}`;
    const a = buatProduk({ name: aktifNama });
    // kontrol positif: produk aktif yang sama bentuknya muncul
    await page.goto(`/produk?q=${encodeURIComponent(aktifNama)}`);
    await expect(page.getByTestId("kartu-produk")).toHaveCount(1);
    expect((await page.goto(`/produk/${a.slug}`))?.status()).toBe(200);
    // nonaktif
    await page.goto(`/produk?q=${encodeURIComponent(nama)}`);
    await expect(page.getByTestId("kartu-produk")).toHaveCount(0);
    const res = await page.goto(`/produk/${p.slug}`);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
    const sm = await (await request.get("/sitemap.xml")).text();
    expect(sm).toContain(`/produk/${a.slug}`);
    expect(sm).not.toContain(p.slug);
    await page.goto("/");
    await expect(page.getByText(nama)).toHaveCount(0);
  });

  test("varian nonaktif tidak bisa dipilih/ditampilkan; produk tanpa varian aktif dianggap habis", async ({
    page,
  }) => {
    const p = buatProduk({
      price: 10000,
      varian: [
        { name: "Aktif", stock: 3 },
        { name: "Dimatikan", stock: 99, active: false },
      ],
    });
    await page.goto(`/produk/${p.slug}`);
    await expect(page.getByText("Dimatikan")).toHaveCount(0);
    const q = buatProduk({ varian: [{ name: "Mati", stock: 9, active: false }] });
    await page.goto(`/produk?q=${encodeURIComponent(q.name)}`);
    await expect(page.getByTestId("kartu-produk")).toHaveCount(1);
    await expect(page.getByTestId("badge-habis")).toBeVisible();
    await page.goto(`/produk/${q.slug}`);
    await expect(page.getByTestId("stok")).toContainText("Stok habis");
  });

  test("stok habis ditandai di kartu & detail; stok menipis ('Tersisa n') dan cukup", async ({
    page,
  }) => {
    const habis = buatProduk({ varian: [{ name: "Standar", stock: 0 }] });
    await page.goto(`/produk?q=${encodeURIComponent(habis.name)}`);
    await expect(page.getByTestId("badge-habis")).toHaveText("Stok habis");
    await page.goto(`/produk/${habis.slug}`);
    await expect(page.getByTestId("stok")).toContainText("Stok habis");
    const tipis = buatProduk({ varian: [{ name: "Standar", stock: 3 }] });
    await page.goto(`/produk/${tipis.slug}`);
    await expect(page.getByTestId("stok")).toContainText("Tersisa 3");
    const cukup = buatProduk({ varian: [{ name: "Standar", stock: 50 }] });
    await page.goto(`/produk/${cukup.slug}`);
    await expect(page.getByTestId("stok")).toContainText("Stok tersedia: 50");
    // stok negatif (data kotor) diperlakukan habis
    const neg = buatProduk({ varian: [{ name: "Standar", stock: -4 }] });
    await page.goto(`/produk?q=${encodeURIComponent(neg.name)}`);
    await expect(page.getByTestId("badge-habis")).toBeVisible();
  });
});

test.describe("detail produk", () => {
  test("harga & stok mengikuti varian; varian habis disabled; 'mulai dari' di kartu", async ({
    page,
  }) => {
    await page.goto("/produk/kemeja-batik-cap-pria");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kemeja Batik Cap Pria");
    await expect(page.getByTestId("harga-terpilih")).toContainText("185.000");
    await page.getByText("XL", { exact: true }).click();
    await expect(page.getByTestId("harga-terpilih")).toContainText("195.000"); // harga override varian
    await expect(page.getByRole("radio", { name: "XL" })).toBeChecked();
    await expect(page.getByTestId("stok")).toContainText("Stok tersedia: 15");
    await page.getByText("M", { exact: true }).click();
    await expect(page.getByTestId("harga-terpilih")).toContainText("185.000");
    // kartu: harga mulai dari termurah
    await page.goto("/produk?q=kemeja+batik");
    const kartu = page.getByTestId("kartu-produk").filter({ hasText: "Kemeja Batik Cap Pria" });
    await expect(kartu).toContainText("mulai dari");
    expect(angka((await kartu.getByTestId("harga").textContent())!)).toBe(185000);
    // varian habis tidak bisa dipilih, varian default = varian pertama yang ada stok
    const p = buatProduk({
      price: 20000,
      varian: [
        { name: "Merah", stock: 0 },
        { name: "Biru", stock: 4, price: 25000 },
      ],
    });
    await page.goto(`/produk/${p.slug}`);
    await expect(page.getByRole("radio", { name: /Merah/ })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "Biru" })).toBeChecked();
    await expect(page.getByTestId("harga-terpilih")).toContainText("25.000");
  });

  test("galeri: thumbnail mengganti gambar utama; entri gambar berbahaya/rusak diabaikan", async ({
    page,
  }) => {
    const p = buatProduk({
      image: "/img/produk-2.svg",
      images: JSON.stringify([
        "/img/produk-3.svg",
        "javascript:alert(1)",
        "https://evil.example/x.png",
        "//evil.example/y.png",
        42,
        null,
      ]),
    });
    const peta = await awasi(page);
    await page.goto(`/produk/${p.slug}`);
    const utama = page.getByTestId("gambar-utama");
    await expect(utama).toHaveAttribute("src", "/img/produk-2.svg");
    const thumbs = page.getByRole("list", { name: "Pilih gambar" }).getByRole("button");
    await expect(thumbs).toHaveCount(2); // hanya 2 yang sah
    await thumbs.nth(1).click();
    await expect(utama).toHaveAttribute("src", "/img/produk-3.svg");
    await expect(thumbs.nth(1)).toHaveAttribute("aria-pressed", "true");
    expect(await page.locator('img[src^="javascript"], img[src*="evil"]').count()).toBe(0);
    expect(peta.luar).toEqual([]);
    expect(peta.masalah).toEqual([]);
    // JSON rusak tidak merusak halaman
    const q = buatProduk({ images: "{rusak" });
    expect((await page.goto(`/produk/${q.slug}`))?.status()).toBe(200);
    await expect(page.getByTestId("gambar-utama")).toBeVisible();
  });

  test("nama & deskripsi berisi HTML/skrip tampil sebagai teks; JSON-LD valid dan tak bisa disusupi", async ({
    page,
  }) => {
    const jahat = `</script><script>window.__xss=1</script><img src=x onerror=window.__xss=1>`;
    const p = buatProduk({ name: `Uji ${jahat}`, description: `Baris 1\n${jahat}\nBaris 3` });
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      void d.dismiss();
    });
    await page.goto(`/produk/${p.slug}`);
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(dialog).toBe(false);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("</script><script>");
    await expect(page.getByTestId("deskripsi")).toContainText("Baris 1");
    expect(await page.locator("main img[src='x']").count()).toBe(0);
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    const j = JSON.parse(ld!);
    expect(j["@type"]).toBe("Product");
    expect(j.name).toContain("</script>"); // data utuh, tetapi di HTML "<" sudah di-escape
    expect(ld).not.toContain("<");
    expect(j.offers.priceCurrency).toBe("IDR");
    expect(j.offers.availability).toBe("https://schema.org/InStock");
  });

  test("slug tidak sah → 404 (tanpa error server), termasuk traversal & injeksi", async ({
    page,
  }) => {
    for (const s of [
      "tidak-ada",
      "UPPER",
      "..%2F..%2Fetc%2Fpasswd",
      "%3Cscript%3E",
      "a'--",
      "x".repeat(300),
      "%00",
      "kopi arabika",
    ]) {
      const res = await page.goto(`/produk/${s}`);
      expect(res?.status(), s).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
    }
  });

  test("metadata: title, deskripsi, canonical, og:image; hasil pencarian noindex", async ({
    page,
  }) => {
    await page.goto("/produk/kopi-arabika-gayo-250g");
    await expect(page).toHaveTitle("Kopi Arabika Gayo 250 g | Toko Nusantara Craft");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Gayo/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/produk\/kopi-arabika-gayo-250g$/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/img\/produk-1\.svg$/,
    );
    await page.goto("/produk?q=kopi");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await page.goto("/produk");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("produk terkait: sekategori, bukan dirinya, hanya aktif", async ({ page }) => {
    const nonaktif = buatProduk({
      name: `Mati ${huruf()}`,
      active: false,
      kategoriSlug: "kopi-teh",
    });
    await page.goto("/produk/kopi-arabika-gayo-250g");
    const terkait = page.getByRole("region", { name: "Produk terkait" });
    const judul = await terkait.getByRole("heading", { level: 3 }).allTextContents();
    expect(judul.length).toBeGreaterThan(0);
    expect(judul).not.toContain("Kopi Arabika Gayo 250 g");
    expect(judul.join()).not.toContain(nonaktif.name);
    for (const k of await terkait.getByTestId("kartu-produk").all())
      await expect(k).toContainText("Kopi & Teh");
  });
});

test.describe("kualitas (a11y, responsif, tautan)", () => {
  test("semua tautan internal dari beranda, katalog, detail menghasilkan 200", async ({
    page,
    request,
  }) => {
    const dikunjungi = new Set<string>();
    for (const awal of ["/", "/produk", "/produk/kopi-arabika-gayo-250g"]) {
      await page.goto(awal);
      const href = await page
        .locator("a[href]")
        .evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
      for (const h of href) {
        if (!h.startsWith("/") || h.startsWith("//") || dikunjungi.has(h)) continue;
        dikunjungi.add(h);
        const r = await request.get(h);
        expect(r.status(), `${awal} → ${h}`).toBe(200);
      }
    }
    expect(dikunjungi.size).toBeGreaterThan(10);
  });

  for (const lebar of [360, 768, 1280]) {
    test(`tanpa overflow horizontal di ${lebar}px (termasuk nama sangat panjang tanpa spasi)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: lebar, height: 800 });
      const p = buatProduk({ name: `X${"A".repeat(120)}${huruf()}`, description: "B".repeat(400) });
      for (const url of [
        "/",
        "/produk",
        `/produk?q=${encodeURIComponent(p.name.slice(0, 40))}`,
        `/produk/${p.slug}`,
        "/produk/kemeja-batik-cap-pria",
      ]) {
        await page.goto(url);
        const lebihLebar = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(lebihLebar, `${url} @${lebar}`).toBeLessThanOrEqual(0);
      }
    });
  }

  test("struktur heading berurutan, landmark, skip link, label form, gambar beralt", async ({
    page,
  }) => {
    for (const url of ["/", "/produk", "/produk/kemeja-batik-cap-pria"]) {
      await page.goto(url);
      const levels = await page
        .locator("h1,h2,h3,h4")
        .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
      expect(
        levels.filter((l) => l === 1),
        url,
      ).toHaveLength(1);
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i++)
        expect(levels[i]! - levels[i - 1]!, `${url} ${levels.join(",")}`).toBeLessThanOrEqual(1);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      const tanpaAlt = await page.locator("img:not([alt])").count();
      expect(tanpaAlt, url).toBe(0);
    }
    await page.goto("/produk");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Langsung ke konten utama" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#isi$/);
    // semua kontrol filter berlabel
    for (const l of ["Cari produk", "Kategori", "Urutkan"])
      await expect(page.getByLabel(l)).toBeVisible();
  });

  test("kartu produk: satu tautan per kartu, bisa difokus keyboard dan tampak fokusnya", async ({
    page,
  }) => {
    await page.goto("/produk");
    const kartu = page.getByTestId("kartu-produk").first();
    await expect(kartu.getByRole("link")).toHaveCount(1);
    await kartu.getByRole("link").focus();
    await expect(kartu).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/produk\/[a-z0-9-]+$/);
  });

  test("robots.txt & sitemap.xml", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap:");
    const sm = await (await request.get("/sitemap.xml")).text();
    const n = query<{ c: number }>("SELECT count(*) c FROM Product WHERE active = 1")[0]!.c;
    expect((sm.match(/\/produk\/[a-z0-9-]+<\/loc>/g) ?? []).length).toBeGreaterThanOrEqual(n - 5); // toleran thd produk yang disisipkan tes paralel
    expect(sm).toContain("<loc>");
  });

  test("tidak ada error konsol/CSP, permintaan ke luar, atau aset 4xx di beranda/katalog/detail", async ({
    page,
  }) => {
    const peta = await awasi(page);
    for (const u of [
      "/",
      "/produk",
      "/produk?kategori=kopi-teh&urut=termurah",
      "/produk/kopi-arabika-gayo-250g",
    ]) {
      await page.goto(u);
      await page.waitForLoadState("networkidle");
    }
    expect(peta.masalah).toEqual([]);
    expect(peta.luar).toEqual([]);
    expect(peta.gagal).toEqual([]);
  });
});
