import { expect, test, type Page } from "@playwright/test";
import { products } from "../../apps/toko-online/prisma/seed-data";
import { base, cekDasar, gambarTermuat, pantau, tanpaOverflow, telusuri, tenang } from "./helpers";

const URL = base("toko-online");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const produk = products.find((p) => p.varian.some((v) => v.stock >= 5) && p.varian.length === 1)!;

async function tambahKeKeranjang(page: Page, slug: string, jumlah = 1) {
  await page.goto(`${URL}produk/${slug}/`);
  if (jumlah > 1) await page.getByLabel("Jumlah", { exact: true }).fill(String(jumlah));
  await page.getByTestId("tambah-keranjang").click();
  await expect(page.getByTestId("pesan-keranjang")).not.toBeEmpty();
}

test.describe("toko-online (sample statis)", () => {
  test("semua halaman publik muat bersih: tanpa galat/404, gambar termuat, banner & noindex, tanpa overflow 360px", async ({
    page,
  }) => {
    await tenang(page);
    const p = pantau(page);
    for (const path of [
      "",
      "produk/",
      `produk/${produk.slug}/`,
      "keranjang/",
      "checkout/",
      "lacak/",
    ]) {
      await page.goto(`${URL}${path}`);
      await cekDasar(page, /.+/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await gambarTermuat(page);
      await tanpaOverflow(page);
    }
    expect(p.galat).toEqual([]);
  });

  test("seluruh halaman statis dapat dibuka (200, ada <h1>) dengan menelusuri tautan internal", async ({
    request,
  }) => {
    const { masalah, jumlah } = await telusuri(request, [URL], "toko-online");
    expect(masalah).toEqual([]);
    expect(jumlah).toBeGreaterThanOrEqual(products.length);
  });

  test("katalog: kategori, pencarian, urutan, paginasi dihitung di peramban (URL dapat dibagikan)", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}produk/`);
    const total = products.length;
    await expect(page.getByTestId("jumlah-hasil")).toContainText(`Menampilkan ${total} produk`);
    // paginasi: 12 per halaman → halaman 2 ada
    expect(total).toBeGreaterThan(12);
    await page.getByRole("link", { name: "Berikutnya" }).click();
    await expect(page).toHaveURL(/halaman=2/);
    await expect(page.getByTestId("jumlah-hasil")).toContainText("halaman 2 dari 2");
    await expect(page.getByTestId("daftar-produk").locator("li")).toHaveCount(total - 12);

    // kategori via URL
    const kat = "kopi-teh";
    await page.goto(`${URL}produk/?kategori=${kat}`);
    const n = products.filter((x) => x.kategori === kat).length;
    await expect(page.getByTestId("jumlah-hasil")).toContainText(`Menampilkan ${n} produk`);

    // pencarian lewat form (GET) — wildcard "%" diperlakukan sebagai teks, bukan "cocok semua"
    await page.goto(`${URL}produk/`);
    await page.getByLabel("Cari produk").fill("%");
    await page.getByRole("button", { name: /Terapkan|Cari/ }).click();
    await expect(page.getByTestId("jumlah-hasil")).toHaveText("Tidak ada produk yang cocok.");
    await page.getByLabel("Cari produk").fill(produk.name.split(" ")[0]!);
    await page.getByRole("button", { name: /Terapkan|Cari/ }).click();
    await expect(page.getByTestId("daftar-produk")).toContainText(produk.name);

    // urutan harga
    await page.goto(`${URL}produk/?urut=termurah`);
    const harga = await page
      .getByTestId("harga")
      .allInnerTexts()
      .then((a) => a.map((t) => Number((t.match(/[\d.]+/)?.[0] ?? "0").replace(/\./g, ""))));
    expect(harga.length).toBeGreaterThan(3);
    expect([...harga].sort((a, b) => a - b)).toEqual(harga);
    expect(p.galat).toEqual([]);
  });

  test("alur belanja: keranjang → checkout (voucher, ongkir per kota) → konfirmasi → lacak → unggah bukti; tanpa request ke server", async ({
    page,
  }) => {
    const p = pantau(page);
    const harga = produk.price;
    await tambahKeKeranjang(page, produk.slug, 3);
    await page.goto(`${URL}keranjang/`);
    await expect(page.getByTestId("daftar-keranjang")).toContainText(produk.name);
    await page.getByTestId("ke-checkout").click();
    await expect(page.getByTestId("co-total")).toBeVisible();
    await expect(page.getByTestId("co-subtotal")).toContainText(
      new Intl.NumberFormat("id-ID").format(harga * 3),
    );
    await expect(page.getByTestId("co-ongkir")).toContainText("25.000"); // bawaan sebelum kota diisi

    await page.getByLabel(/Kota/).fill("Yogyakarta");
    await expect(page.getByTestId("co-ongkir")).toContainText("10.000");
    await page.getByLabel("Kode voucher").fill("hemat10");
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page.getByTestId("status-voucher")).toContainText("HEMAT10 diterapkan");
    const diskon = Math.floor((harga * 3 * 10) / 100);
    await expect(page.getByTestId("co-diskon")).toContainText(
      new Intl.NumberFormat("id-ID").format(diskon),
    );
    const total = harga * 3 + 10_000 - diskon;
    await expect(page.getByTestId("co-total")).toContainText(
      new Intl.NumberFormat("id-ID").format(total),
    );

    const telepon = "081298765432";
    await page.getByLabel(/Nama lengkap/).fill("Siti Aminah");
    await page.getByLabel(/No\. HP/).fill(telepon);
    await page.getByLabel(/Alamat lengkap/).fill("Jl. Kenanga No. 7, Sleman");
    await page.getByTestId("buat-pesanan").click();
    const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
    expect(kode).toMatch(/^TKO-[2-9A-HJKMNP-Z]{8}$/);
    await expect(page.getByTestId("total-bayar")).toContainText(
      new Intl.NumberFormat("id-ID").format(total),
    );
    await expect(page.getByTestId("daftar-rekening")).toContainText("Bank Nusantara");
    await expect(page.getByTestId("kirim-wa")).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/62\d+\?text=/,
    );

    // lacak: salah HP → pesan identik; benar → rincian; unggah bukti
    await page.goto(`${URL}lacak/?kode=${kode}`);
    const form = page.getByRole("form", { name: "Cek pesanan" });
    await form.getByLabel(/No\. HP saat memesan/).fill("081200000000");
    await form.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(page.getByTestId("galat-lacak")).toBeVisible();
    await form.getByLabel(/No\. HP saat memesan/).fill(telepon);
    await form.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(page.getByTestId("tahapan")).toContainText("Menunggu pembayaran");
    await page.locator('input[type="file"]').setInputFiles({
      name: "bukti.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await page.getByRole("button", { name: "Kirim bukti" }).click();
    await expect(page.getByText(/berhasil diunggah/)).toBeVisible();

    expect(p.request.filter((r) => r.startsWith("POST"))).toEqual([]);
    expect(p.galat).toEqual([]);
  });

  test("lacak: pesanan contoh bawaan (kode+HP) tampil; kode/HP salah → pesan identik", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}lacak/`);
    await expect(page.getByTestId("contoh-lacak")).toContainText("TKO-K7M2XQ4P");
    const form = page.getByRole("form", { name: "Cek pesanan" });
    await form.getByLabel(/Kode pesanan/).fill("TKO-K7M2XQ4P");
    await form.getByLabel(/No\. HP saat memesan/).fill("081234567890");
    await form.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(page.getByTestId("tahapan")).toContainText("Dikirim");
    // kode tak dikenal dengan HP benar → pesan yang sama persis dengan HP salah
    const pesan = async (k: string, hp: string) => {
      await form.getByLabel(/Kode pesanan/).fill(k);
      await form.getByLabel(/No\. HP saat memesan/).fill(hp);
      await form.getByRole("button", { name: "Cek pesanan" }).click();
      return (
        await page
          .getByRole("alert")
          .filter({ hasText: /tidak cocok/ })
          .innerText()
      ).trim();
    };
    expect(await pesan("TKO-AAAAAAAA", "081234567890")).toBe(
      await pesan("TKO-K7M2XQ4P", "081200000000"),
    );
    expect(p.galat.filter((g) => !/HTTP 404/.test(g))).toEqual([]);
  });

  test("keamanan klien: manipulasi total di checkout tidak menurunkan harga (angka dihitung ulang)", async ({
    page,
  }) => {
    await tambahKeKeranjang(page, produk.slug, 1);
    await page.goto(`${URL}checkout/`);
    // injeksi item dengan harga palsu lewat localStorage diabaikan: yang dibaca hanya varianId + qty
    await page.evaluate(() => {
      const k = "toko.keranjang.v1";
      const j = JSON.parse(localStorage.getItem(k) ?? "[]") as Array<Record<string, unknown>>;
      localStorage.setItem(k, JSON.stringify(j.map((x) => ({ ...x, harga: 1, price: 1, qty: 2 }))));
    });
    await page.reload();
    await expect(page.getByTestId("co-subtotal")).toContainText(
      new Intl.NumberFormat("id-ID").format(produk.price * 2),
    );
  });

  test("tanpa admin/API/unggahan di hasil", async ({ request }) => {
    for (const path of ["admin/", "api/pesanan/", "api/auth/session/", "uploads/x.png"])
      expect((await request.get(`${URL}${path}`)).status(), path).toBe(404);
  });
});
