import { existsSync, readFileSync, readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  PNG_1X1,
  berkasPng,
  buatProduk,
  huruf,
  idVarian,
  login,
  query,
  stokVarian,
  tulis,
} from "./helpers";

const UP = "e2e-uploads";
const berkasUp = () =>
  existsSync(UP) ? readdirSync(UP).filter((f) => /\.(png|jpg|webp)$/.test(f)) : [];
const adaIsiBerbahaya = () =>
  berkasUp().some((f) =>
    /<svg|<\?php|<script|alert\(|^GIF8/m.test(readFileSync(`${UP}/${f}`, "latin1").slice(0, 2048)),
  );
const sku = () => `UJI-${huruf()}`.toUpperCase();
const produkDb = (nama: string) =>
  query<{
    id: number;
    slug: string;
    image: string;
    images: string;
    price: number;
    active: number;
    categoryId: number;
  }>("SELECT * FROM Product WHERE name = ?", nama)[0];

async function isiProduk(
  page: Page,
  o: { nama: string; harga?: string; deskripsi?: string; kategori?: string },
) {
  await page.getByLabel("Nama produk").fill(o.nama);
  await page.getByLabel("Kategori").selectOption(o.kategori ?? { label: "Kopi & Teh" });
  await page.getByLabel(/Harga dasar/).fill(o.harga ?? "50000");
  await page
    .getByLabel("Deskripsi")
    .fill(o.deskripsi ?? "Deskripsi produk uji yang cukup panjang.");
}
const varian = (page: Page, i: number) => page.getByTestId("baris-varian").nth(i);
async function isiVarian(
  page: Page,
  i: number,
  v: { nama: string; sku: string; harga?: string; stok?: string },
) {
  const r = varian(page, i);
  await r.getByLabel("Nama varian").fill(v.nama);
  await r.getByLabel("SKU").fill(v.sku);
  if (v.harga !== undefined) await r.getByLabel(/Harga varian/).fill(v.harga);
  if (v.stok !== undefined) await r.getByLabel("Stok awal").fill(v.stok);
}
/** Klik Simpan dan tunggu respons server action SELESAI (jangan membaca DB sebelum itu). */
const simpan = async (page: Page) => {
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes("/admin/produk"),
    ),
    page.getByRole("button", { name: "Simpan" }).click(),
  ]);
};

test.describe("produk: buat, ubah, nonaktifkan, hapus", () => {
  test("buat produk lengkap (gambar + 2 varian) → tampil di toko dengan harga & stok benar; gambar tersaji aman dari /uploads", async ({
    page,
    request,
  }) => {
    await login(page);
    const nama = `Produk Uji ${huruf()}`;
    const s1 = sku();
    const s2 = sku();
    await page.goto("/admin/produk/baru");
    await isiProduk(page, { nama, harga: "Rp 75.000" });
    await isiVarian(page, 0, { nama: "Kecil", sku: s1.toLowerCase(), stok: "7" });
    await page.getByRole("button", { name: "+ Tambah varian" }).click();
    await isiVarian(page, 1, { nama: "Besar", sku: s2, harga: "99.000", stok: "3" });
    await page.getByLabel("Gambar utama").setInputFiles(berkasPng("foto asli.png"));
    await simpan(page);
    await expect(page).toHaveURL(/\/admin\/produk\?ok=tersimpan/);
    await expect(page.getByTestId("flash")).toBeVisible();
    const p = produkDb(nama)!;
    expect(p).toMatchObject({ price: 75_000, active: 1 });
    expect(p.slug).toMatch(/^produk-uji-[a-p]{6}$/);
    expect(p.image).toMatch(/^\/uploads\/[A-Za-z0-9_-]{16,64}\.png$/);
    expect(p.image).not.toContain("foto");
    const v = query<{
      name: string;
      sku: string;
      price: number | null;
      stock: number;
      active: number;
    }>("SELECT name, sku, price, stock, active FROM Variant WHERE productId = ? ORDER BY id", p.id);
    expect(v).toEqual([
      { name: "Kecil", sku: s1, price: null, stock: 7, active: 1 }, // SKU huruf besar
      { name: "Besar", sku: s2, price: 99_000, stock: 3, active: 1 },
    ]);
    // tampil di toko
    await page.goto(`/produk/${p.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(nama);
    await expect(page.getByTestId("harga-terpilih")).toContainText("75.000");
    await page.getByText("Besar", { exact: true }).click();
    await expect(page.getByTestId("harga-terpilih")).toContainText("99.000");
    await expect(page.getByTestId("gambar-utama")).toHaveAttribute("src", p.image);
    // berkas tersaji dengan header aman
    const g = await request.get(p.image);
    expect(g.status()).toBe(200);
    expect(g.headers()["content-type"]).toBe("image/png");
    expect(g.headers()["x-content-type-options"]).toBe("nosniff");
    expect(g.headers()["content-security-policy"]).toContain("sandbox");
    expect(Buffer.from(await g.body()).equals(PNG_1X1)).toBe(true);
  });

  test("ubah: nama/harga/deskripsi + varian (tambah, hapus, ubah) — slug tetap; stok varian yang ada TIDAK ditimpa walau berubah di DB saat form terbuka", async ({
    page,
  }) => {
    const p = buatProduk({
      name: `Ubah ${huruf()}`,
      price: 20_000,
      varian: [
        { name: "A", stock: 10 },
        { name: "B", stock: 4 },
      ],
    });
    const [va, vb] = idVarian(p.id);
    await login(page);
    await page.goto(`/admin/produk/${p.id}`);
    await expect(varian(page, 0).getByTestId("stok-saat-ini")).toHaveText("10");
    // simulasi pesanan masuk saat form terbuka
    tulis((d) => d.prepare("UPDATE Variant SET stock = 6 WHERE id = ?").run(va));
    await page.getByLabel("Nama produk").fill(`${p.name} Edit`);
    await page.getByLabel(/Harga dasar/).fill("25.000");
    await varian(page, 0)
      .getByLabel(/Harga varian/)
      .fill("30000");
    await varian(page, 0).getByLabel("Nama varian").fill("A2");
    await varian(page, 1)
      .getByRole("button", { name: /Hapus varian/ })
      .click(); // hapus B
    await page.getByRole("button", { name: "+ Tambah varian" }).click();
    const sBaru = sku();
    await isiVarian(page, 1, { nama: "C", sku: sBaru, stok: "9" });
    await simpan(page);
    await expect(page).toHaveURL(/ok=tersimpan/);
    const akhir = query<{
      id: number;
      name: string;
      price: number | null;
      stock: number;
      sku: string;
    }>("SELECT id, name, price, stock, sku FROM Variant WHERE productId = ? ORDER BY id", p.id);
    expect(akhir.map((x) => x.name)).toEqual(["A2", "C"]);
    expect(akhir[0]).toMatchObject({ id: va, price: 30_000, stock: 6 }); // stok = nilai DB terbaru, bukan 10
    expect(akhir[1]).toMatchObject({ stock: 9, sku: sBaru });
    expect(query("SELECT 1 FROM Variant WHERE id = ?", vb)).toHaveLength(0);
    expect(
      query<{ name: string; slug: string; price: number }>(
        "SELECT name, slug, price FROM Product WHERE id = ?",
        p.id,
      )[0],
    ).toEqual({ name: `${p.name} Edit`, slug: p.slug, price: 25_000 });
    expect(stokVarian(va!)).toBe(6);
  });

  test("nonaktifkan → hilang dari toko (detail 404); aktifkan lagi → kembali; hapus → 404 & berkas gambar dibersihkan, riwayat pesanan tetap", async ({
    page,
    request,
  }) => {
    await login(page);
    const nama = `Siklus ${huruf()}`;
    await page.goto("/admin/produk/baru");
    await isiProduk(page, { nama });
    await isiVarian(page, 0, { nama: "Standar", sku: sku(), stok: "5" });
    await page.getByLabel("Gambar utama").setInputFiles(berkasPng());
    await simpan(page);
    const p = produkDb(nama)!;
    const berkas = p.image.replace("/uploads/", "");
    expect(existsSync(`${UP}/${berkas}`)).toBe(true);
    expect((await request.get(`/produk/${p.slug}`)).status()).toBe(200);
    const baris = () => page.getByTestId("baris-produk").filter({ hasText: nama });
    await page.goto(`/admin/produk?q=${encodeURIComponent(nama)}`);
    await baris().getByRole("button", { name: "Nonaktifkan" }).click();
    await expect(baris().getByText("Nonaktif", { exact: true })).toBeVisible();
    expect((await request.get(`/produk/${p.slug}`)).status()).toBe(404);
    await page.goto(`/admin/produk?q=${encodeURIComponent(nama)}`);
    await baris().getByRole("button", { name: "Aktifkan" }).click();
    expect((await request.get(`/produk/${p.slug}`)).status()).toBe(200);
    // pesanan lama yang merujuk produk ini tetap utuh setelah dihapus
    const vid = idVarian(p.id)[0]!;
    tulis((d) => {
      const now = new Date().toISOString().replace("Z", "+00:00");
      const o = d
        .prepare(
          'INSERT INTO "Order" (code, status, customerName, customerPhone, address, city, subtotal, shippingCost, total, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        )
        .run(
          `TKO-${huruf().toUpperCase()}22`,
          "SELESAI",
          "X",
          "628111",
          "Alamat uji",
          "K",
          1,
          0,
          1,
          now,
          now,
        );
      d.prepare(
        "INSERT INTO OrderItem (orderId, productId, variantId, productName, variantName, unitPrice, qty, lineTotal) VALUES (?,?,?,?,?,?,?,?)",
      ).run(Number(o.lastInsertRowid), p.id, vid, nama, "Standar", 1, 1, 1);
    });
    await page.goto(`/admin/produk?q=${encodeURIComponent(nama)}`);
    page.once("dialog", (d) => void d.accept());
    await baris().getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect((await request.get(`/produk/${p.slug}`)).status()).toBe(404);
    expect(existsSync(`${UP}/${berkas}`)).toBe(false);
    const item = query<{ productId: number | null; productName: string }>(
      "SELECT productId, productName FROM OrderItem WHERE productName = ?",
      nama,
    );
    expect(item).toEqual([{ productId: null, productName: nama }]); // snapshot utuh
  });

  test("hanya satu gambar yang dibersihkan bila masih dirujuk produk lain (referensi dihitung)", async ({
    page,
  }) => {
    await login(page);
    const nama = `Rujuk ${huruf()}`;
    await page.goto("/admin/produk/baru");
    await isiProduk(page, { nama });
    await isiVarian(page, 0, { nama: "S", sku: sku(), stok: "1" });
    await page.getByLabel("Gambar utama").setInputFiles(berkasPng());
    await simpan(page);
    const p = produkDb(nama)!;
    buatProduk({ image: p.image }); // produk lain merujuk berkas yang sama
    await page.goto(`/admin/produk?q=${encodeURIComponent(nama)}`);
    page.once("dialog", (d) => void d.accept());
    await page
      .getByTestId("baris-produk")
      .filter({ hasText: nama })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByTestId("flash")).toBeVisible();
    expect(existsSync(`${UP}/${p.image.replace("/uploads/", "")}`)).toBe(true);
  });
});

test.describe("produk: validasi & ketahanan", () => {
  test("isian kosong → galat per-field di semua bagian; isian & baris varian tidak hilang; tidak ada produk tersimpan", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/produk/baru");
    const sebelum = query<{ c: number }>("SELECT count(*) c FROM Product")[0]!.c;
    await page.getByRole("button", { name: "+ Tambah varian" }).click();
    await page.getByLabel("Nama produk").fill("ab");
    await page.getByLabel(/Harga dasar/).fill("1,5 juta");
    await varian(page, 1).getByLabel("Nama varian").fill("Dua");
    await varian(page, 1).getByLabel("SKU").fill("tidak valid!");
    await varian(page, 1).getByLabel("Stok awal").fill("-3");
    await simpan(page);
    await expect(page.getByText(/Nama produk minimal 3 karakter/)).toBeVisible();
    await expect(page.getByText(/Harga: Hanya angka bulat rupiah/)).toBeVisible();
    await expect(page.getByText(/Pilih kategori/)).toBeVisible();
    await expect(page.getByText(/Deskripsi minimal 10/)).toBeVisible();
    await expect(page.getByText(/SKU 2–40 karakter/).first()).toBeVisible();
    await expect(page.getByText(/Stok minimal 0/)).toBeVisible();
    await expect(page.getByLabel("Nama produk")).toHaveValue("ab"); // tidak hilang
    await expect(page.getByTestId("baris-varian")).toHaveCount(2); // baris varian tetap
    await expect(varian(page, 1).getByLabel("Nama varian")).toHaveValue("Dua");
    expect(query<{ c: number }>("SELECT count(*) c FROM Product")[0]!.c).toBe(sebelum);
  });

  test("SKU bentrok (dengan produk lain & di dalam form sendiri) ditolak; produk tidak terbuat", async ({
    page,
  }) => {
    const lain = buatProduk({});
    const skuLain = query<{ sku: string }>(
      "SELECT sku FROM Variant WHERE productId = ?",
      lain.id,
    )[0]!.sku;
    await login(page);
    await page.goto("/admin/produk/baru");
    const nama = `Bentrok ${huruf()}`;
    await isiProduk(page, { nama });
    await isiVarian(page, 0, { nama: "A", sku: skuLain, stok: "1" });
    await simpan(page);
    await expect(page.getByText("SKU sudah dipakai varian lain.")).toBeVisible();
    expect(produkDb(nama)).toBeUndefined();
    const s = sku();
    await isiVarian(page, 0, { nama: "A", sku: s });
    await page.getByRole("button", { name: "+ Tambah varian" }).click();
    await isiVarian(page, 1, { nama: "B", sku: s.toLowerCase(), stok: "1" });
    await simpan(page);
    await expect(page.getByText(/dipakai dua varian/)).toBeVisible();
    expect(produkDb(nama)).toBeUndefined();
  });

  test("unggah berbahaya ditolak (SVG/HTML/PHP/GIF/EXE dinamai .png, MIME tak cocok, > 2 MB): produk tidak terbuat & tidak ada berkas berbahaya tersimpan", async ({
    page,
  }) => {
    await login(page);
    const kasus: Array<[string, Buffer, string]> = [
      [
        "svg",
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
        "image/png",
      ],
      ["html", Buffer.from("<!doctype html><script>alert(1)</script>"), "image/png"],
      ["php", Buffer.from("<?php system($_GET[1]); ?>"), "image/png"],
      ["gif", Buffer.from("GIF89a\x01\x00\x01\x00"), "image/png"],
      ["exe", Buffer.from([0x4d, 0x5a, 0x90, 0x00]), "image/png"],
      ["png-diklaim-jpeg", PNG_1X1, "image/jpeg"],
      ["terlalu-besar", Buffer.concat([PNG_1X1, Buffer.alloc(2 * 1024 * 1024)]), "image/png"],
    ];
    for (const [k, buffer, mimeType] of kasus) {
      const nama = `Berbahaya ${k} ${huruf()}`;
      await page.goto("/admin/produk/baru");
      await isiProduk(page, { nama });
      await isiVarian(page, 0, { nama: "S", sku: sku(), stok: "1" });
      await page.getByLabel("Gambar utama").setInputFiles({ name: `${k}.png`, mimeType, buffer });
      await simpan(page);
      await expect(page.locator("main").getByText(new RegExp(`${k}\\.png: `)), k).toBeVisible();
      expect(produkDb(nama), k).toBeUndefined();
    }
    expect(adaIsiBerbahaya()).toBe(false);
  });

  test("galeri: tambah beberapa gambar, hapus satu (berkas ikut bersih), batas 8; gagal sebagian = tidak ada yang tersimpan", async ({
    page,
  }) => {
    await login(page);
    const nama = `Galeri ${huruf()}`;
    await page.goto("/admin/produk/baru");
    await isiProduk(page, { nama });
    await isiVarian(page, 0, { nama: "S", sku: sku(), stok: "1" });
    await page.getByLabel("Tambah gambar").setInputFiles([berkasPng("a.png"), berkasPng("b.png")]);
    await simpan(page);
    const p = produkDb(nama)!;
    const galeri = JSON.parse(p.images) as string[];
    expect(galeri).toHaveLength(2);
    for (const g of galeri) expect(existsSync(`${UP}/${g.replace("/uploads/", "")}`)).toBe(true);
    await page.goto(`/produk/${p.slug}`);
    await expect(page.getByRole("list", { name: "Pilih gambar" }).getByRole("button")).toHaveCount(
      3,
    ); // utama(placeholder) + 2
    // hapus satu
    await page.goto(`/admin/produk/${p.id}`);
    await page.locator('input[name="hapusGaleri"]').first().check();
    await simpan(page);
    const sisa = JSON.parse(produkDb(nama)!.images) as string[];
    expect(sisa).toHaveLength(1);
    expect(existsSync(`${UP}/${galeri[0]!.replace("/uploads/", "")}`)).toBe(false);
    expect(existsSync(`${UP}/${galeri[1]!.replace("/uploads/", "")}`)).toBe(true);
    // batas 8: 1 sisa + 8 baru = 9 → ditolak
    await page.goto(`/admin/produk/${p.id}`);
    await page
      .getByLabel("Tambah gambar")
      .setInputFiles(Array.from({ length: 8 }, (_, i) => berkasPng(`g${i}.png`)));
    await simpan(page);
    await expect(page.getByText("Maksimal 8 gambar tambahan.")).toBeVisible();
    expect(JSON.parse(produkDb(nama)!.images)).toHaveLength(1);
    // satu berkas buruk di antara yang baik → tidak ada yang tersimpan
    const sebelum = berkasUp().length;
    await page.goto(`/admin/produk/${p.id}`);
    await page
      .getByLabel("Tambah gambar")
      .setInputFiles([
        berkasPng("ok.png"),
        { name: "jahat.png", mimeType: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") },
      ]);
    await simpan(page);
    await expect(page.getByText(/jahat\.png: /)).toBeVisible();
    expect(JSON.parse(produkDb(nama)!.images)).toHaveLength(1);
    expect(berkasUp().length).toBeGreaterThanOrEqual(sebelum); // (tes paralel boleh menambah) — yang penting tak ada berkas berbahaya:
    expect(adaIsiBerbahaya()).toBe(false);
  });

  test("manipulasi DOM: kategori fiktif & ID varian milik produk lain ditolak; produk lain tidak berubah", async ({
    page,
  }) => {
    const korban = buatProduk({ name: `Korban ${huruf()}`, varian: [{ name: "Asli", stock: 5 }] });
    const [vk] = idVarian(korban.id);
    const saya = buatProduk({ name: `Saya ${huruf()}` });
    await login(page);
    await page.goto(`/admin/produk/${saya.id}`);
    await page
      .locator('input[name="v0_id"]')
      .evaluate((e, id) => ((e as HTMLInputElement).value = String(id)), vk);
    await varian(page, 0).getByLabel("Nama varian").fill("DIBAJAK");
    await simpan(page);
    await expect(page.getByText("Varian tidak valid. Muat ulang halaman.")).toBeVisible();
    expect(query<{ name: string }>("SELECT name FROM Variant WHERE id = ?", vk)[0]!.name).toBe(
      "Asli",
    );
    await page.goto(`/admin/produk/${saya.id}`);
    await page.getByLabel("Kategori").evaluate((s) => {
      const o = document.createElement("option");
      o.value = "99999999";
      o.textContent = "Fiktif";
      (s as HTMLSelectElement).appendChild(o);
      (s as HTMLSelectElement).value = "99999999";
    });
    await simpan(page);
    await expect(page.getByText("Kategori tidak ditemukan.")).toBeVisible();
  });

  test("nama/deskripsi berisi HTML dibersihkan; daftar admin menampilkan sebagai teks; id aneh → 404", async ({
    page,
  }) => {
    await login(page);
    const tag = huruf();
    await page.goto("/admin/produk/baru");
    await isiProduk(page, {
      nama: `<img src=x onerror=alert(1)>Nama ${tag}`,
      deskripsi: "Deskripsi <script>alert(1)</script> cukup panjang untuk lolos validasi.",
    });
    await isiVarian(page, 0, { nama: "S", sku: sku(), stok: "1" });
    await simpan(page);
    const p = query<{ name: string; description: string }>(
      "SELECT name, description FROM Product WHERE name LIKE ?",
      `%Nama ${tag}`,
    )[0]!;
    expect(p.name).not.toMatch(/[<>]/);
    expect(p.description).not.toMatch(/[<>]/);
    expect(await page.locator("main img[src='x']").count()).toBe(0);
    for (const id of ["999999", "abc", "-1", "1e3"])
      expect((await page.goto(`/admin/produk/${id}`))?.status(), id).toBe(404);
  });

  test("daftar: cari & filter status; 360px tanpa overflow; form baru dapat dioperasikan dengan keyboard", async ({
    page,
  }) => {
    const aktif = buatProduk({ name: `Cari ${huruf()}` });
    const mati = buatProduk({ name: `Cari ${huruf()}`, active: false });
    await login(page);
    await page.goto("/admin/produk?status=nonaktif");
    await expect(page.getByTestId("baris-produk").filter({ hasText: mati.name })).toHaveCount(1);
    await expect(page.getByTestId("baris-produk").filter({ hasText: aktif.name })).toHaveCount(0);
    await page.goto(`/admin/produk?q=${encodeURIComponent(aktif.name)}&status=aktif`);
    await expect(page.getByTestId("jumlah-produk")).toHaveText("1 produk");
    await page.setViewportSize({ width: 360, height: 800 });
    for (const u of ["/admin/produk", "/admin/produk/baru", `/admin/produk/${aktif.id}`]) {
      await page.goto(u);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
        u,
      ).toBeLessThanOrEqual(0);
    }
    await page.goto("/admin/produk/baru");
    await page.getByLabel("Nama produk").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Kategori")).toBeFocused();
  });
});
