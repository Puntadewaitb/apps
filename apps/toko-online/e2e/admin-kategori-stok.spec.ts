import { expect, test, type Page } from "@playwright/test";
import {
  STAFF_EMAIL,
  STAFF_PASSWORD,
  buatProduk,
  huruf,
  idVarian,
  login,
  query,
  stokVarian,
} from "./helpers";

const baris = (page: Page) => page.getByTestId("baris-kategori");
async function tambahKategori(page: Page, nama: string, urutan?: string) {
  await page.goto("/admin/kategori");
  const f = page.getByRole("form", { name: "Form kategori baru" });
  await f.getByLabel(/Nama kategori/).fill(nama);
  if (urutan !== undefined) await f.getByLabel(/Urutan/).fill(urutan);
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes("/admin/kategori"),
    ),
    f.getByRole("button", { name: "Simpan" }).click(),
  ]);
}

test.describe("kategori", () => {
  test("tambah → muncul di daftar & filter toko; slug unik untuk nama sama; ubah nama TIDAK mengubah slug", async ({
    page,
  }) => {
    await login(page);
    const nama = `Kategori Uji ${huruf()}`;
    await tambahKategori(page, nama);
    await expect(page.getByTestId("flash")).toHaveText("Perubahan tersimpan.");
    const dasar = query<{ slug: string }>("SELECT slug FROM Category WHERE name = ?", nama)[0]!
      .slug;
    expect(dasar).toMatch(/^kategori-uji-[a-p]{6}$/);
    await tambahKategori(page, nama); // nama sama → slug berbeda
    const semua = query<{ slug: string }>(
      "SELECT slug FROM Category WHERE name = ? ORDER BY id",
      nama,
    ).map((r) => r.slug);
    expect(semua).toEqual([dasar, `${dasar}-2`]);
    // tampil di dropdown filter toko
    await page.goto("/produk");
    await expect(page.getByLabel("Kategori").locator(`option[value="${dasar}"]`)).toHaveText(nama);
    // ubah nama
    await page.goto("/admin/kategori");
    await baris(page)
      .filter({ hasText: dasar })
      .first()
      .getByRole("link", { name: "Ubah" })
      .click();
    await page.getByLabel(/Nama kategori/).fill(`${nama} Baru`);
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByTestId("flash")).toBeVisible();
    expect(
      query("SELECT 1 FROM Category WHERE slug = ? AND name = ?", dasar, `${nama} Baru`),
    ).toHaveLength(1);
  });

  test("validasi: nama pendek / urutan bukan angka → galat per-field, isian tidak hilang, tidak tersimpan", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/kategori");
    const f = page.getByRole("form", { name: "Form kategori baru" });
    await f.getByLabel(/Nama kategori/).fill("a");
    await f.getByLabel(/Urutan/).fill("abc");
    await f.getByRole("button", { name: "Simpan" }).click();
    await expect(f.getByText(/Nama minimal 2 karakter/)).toBeVisible();
    await expect(f.getByText(/Urutan harus bilangan bulat/)).toBeVisible();
    await expect(f.getByLabel(/Nama kategori/)).toHaveValue("a");
    await expect(f.getByLabel(/Urutan/)).toHaveValue("abc");
    expect(query("SELECT 1 FROM Category WHERE name = 'a'")).toHaveLength(0);
  });

  test("hapus: kategori kosong terhapus; kategori berisi produk DITOLAK dengan pesan; HTML pada nama tampil sebagai teks", async ({
    page,
  }) => {
    await login(page);
    const kosong = `Kosong ${huruf()}`;
    await tambahKategori(page, kosong);
    page.once("dialog", (d) => void d.accept());
    await baris(page).filter({ hasText: kosong }).getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect(query("SELECT 1 FROM Category WHERE name = ?", kosong)).toHaveLength(0);
    // berisi produk
    const berisi = `Berisi ${huruf()}`;
    await tambahKategori(page, berisi);
    const slug = query<{ slug: string }>("SELECT slug FROM Category WHERE name = ?", berisi)[0]!
      .slug;
    buatProduk({ kategoriSlug: slug });
    page.once("dialog", (d) => void d.accept());
    await baris(page).filter({ hasText: berisi }).getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByTestId("flash-galat")).toContainText("masih berisi produk");
    expect(query("SELECT 1 FROM Category WHERE slug = ?", slug)).toHaveLength(1);
    // XSS
    let dialog = false;
    page.on("dialog", (d) => {
      dialog = true;
      void d.dismiss();
    });
    await tambahKategori(page, `<img src=x onerror=alert(1)>Tag ${huruf()}`);
    await page.goto("/admin/kategori");
    expect(await page.locator("main img[src='x']").count()).toBe(0);
    expect(dialog).toBe(false);
    expect(
      query<{ name: string }>(
        "SELECT name FROM Category WHERE name LIKE '%Tag %' ORDER BY id DESC LIMIT 1",
      )[0]!.name,
    ).not.toContain("<");
  });

  test("id aneh/tidak ada di URL ubah → 404; STAFF tidak bisa membuka", async ({
    page,
    browser,
  }) => {
    await login(page);
    for (const id of ["999999", "abc", "-1", "1e3", "0x1"])
      expect((await page.goto(`/admin/kategori/${id}`))?.status(), id).toBe(404);
    const s = await (await browser.newContext()).newPage();
    await login(s, STAFF_EMAIL, STAFF_PASSWORD);
    await s.goto("/admin/kategori/1");
    expect(s.url()).toContain("/admin?akses=ditolak");
  });
});

test.describe("stok", () => {
  test("tambah & kurangi stok sebagai selisih; tampil di toko; pengurangan di bawah nol ditolak; masukan aneh ditolak", async ({
    page,
  }) => {
    const p = buatProduk({ varian: [{ name: "Standar", stock: 5 }] });
    const [vid] = idVarian(p.id);
    await login(page);
    await page.goto(`/admin/stok?q=${encodeURIComponent(p.name)}`);
    const b = page.getByTestId("baris-stok");
    await expect(b).toHaveCount(1);
    await expect(b.getByTestId("nilai-stok")).toContainText("5");
    // Tunggu respons server action SELESAI sebelum membaca DB (jangan membaca sebelum perubahan selesai).
    const kirim = async (v: string) => {
      await page.getByLabel(new RegExp(`Selisih stok ${p.name}`)).fill(v);
      await Promise.all([
        page.waitForResponse(
          (r) => r.request().method() === "POST" && r.url().includes("/admin/stok"),
        ),
        page.getByRole("button", { name: "Terapkan" }).last().click(),
      ]);
    };
    await kirim("+10");
    await expect(page.getByTestId("flash")).toHaveText("Stok diperbarui.");
    expect(stokVarian(vid!)).toBe(15);
    await kirim("-3");
    expect(stokVarian(vid!)).toBe(12);
    await expect(page.getByTestId("nilai-stok")).toContainText("12");
    // di bawah nol
    await kirim("-13");
    await expect(page.getByTestId("flash-galat")).toContainText("kurang dari nol");
    expect(stokVarian(vid!)).toBe(12);
    // pas ke nol boleh
    await kirim("-12");
    expect(stokVarian(vid!)).toBe(0);
    await expect(page.getByTestId("nilai-stok")).toContainText("Habis");
    // masukan aneh
    for (const v of ["", "0", "abc", "1.5", "1e3", "99999999", "+-5", "--5", "5; DROP"]) {
      await kirim(v);
      await expect(page.getByTestId("flash-galat"), `"${v}"`).toContainText("tidak valid");
      expect(stokVarian(vid!), `"${v}"`).toBe(0);
    }
    // batas atas
    await kirim("+1000000");
    expect(stokVarian(vid!)).toBe(1_000_000);
    await kirim("+1");
    expect(stokVarian(vid!)).toBe(1_000_000);
    // terlihat di toko
    await kirim("-999990");
    await page.goto(`/produk/${p.slug}`);
    await expect(page.getByTestId("stok")).toContainText("Tersisa");
  });

  test("STAFF boleh mengatur stok; pencarian menyaring; nilai q berbahaya tidak dipantulkan sebagai HTML", async ({
    page,
  }) => {
    const p = buatProduk({ varian: [{ name: "Merah", stock: 4 }] });
    const [vid] = idVarian(p.id);
    await login(page, STAFF_EMAIL, STAFF_PASSWORD);
    await page.goto(`/admin/stok?q=${encodeURIComponent(p.name)}`);
    await expect(page.getByTestId("baris-stok")).toHaveCount(1);
    await page.getByLabel(/Selisih stok/).fill("+6");
    await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes("/admin/stok"),
      ),
      page.getByRole("button", { name: "Terapkan" }).last().click(),
    ]);
    await expect.poll(() => stokVarian(vid!)).toBe(10);
    await page.goto(`/admin/stok?q=${encodeURIComponent('"><script>window.__x=1</script>')}`);
    expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
    await expect(page.getByTestId("baris-stok")).toHaveCount(0);
  });

  test("selisih bersamaan atomik: 10 penambahan +1 serentak → tepat +10 (tidak ada yang hilang)", async ({
    browser,
  }) => {
    const p = buatProduk({ varian: [{ name: "Standar", stock: 0 }] });
    const [vid] = idVarian(p.id);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page);
    await page.goto(`/admin/stok?q=${encodeURIComponent(p.name)}`);
    const html = await page.content();
    const aksi = /name="\$ACTION_ID_([0-9a-f]+)"/.exec(html)![1]!;
    const rs = await Promise.all(
      Array.from({ length: 10 }, () =>
        page.request.post("/admin/stok", {
          multipart: { [`$ACTION_ID_${aksi}`]: "", id: String(vid), delta: "+1" },
          maxRedirects: 0,
        }),
      ),
    );
    expect(rs.every((r) => r.status() < 400)).toBe(true);
    expect(stokVarian(vid!)).toBe(10);
  });
});

test("a11y & responsif admin kategori/stok: heading, caption tabel, label; tanpa overflow 360px", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const u of ["/admin", "/admin/kategori", "/admin/stok", "/admin/produk"]) {
    await page.goto(u);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
      u,
    ).toBeLessThanOrEqual(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const t of await page.locator("table").all())
      expect(await t.locator("caption").count(), u).toBe(1);
    for (const e of await page
      .locator("main input:visible:not([type=hidden]), main select:visible")
      .all()) {
      const n = await e.evaluate((el) => (el as HTMLInputElement).labels?.length ?? 0);
      expect(n, `${u} ${await e.evaluate((el) => el.outerHTML.slice(0, 70))}`).toBeGreaterThan(0);
    }
  }
});
