import { existsSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  berkasPng,
  buatProduk,
  idVarian,
  kunciBaru,
  login,
  query,
  teleponAcak,
  uniqueIp,
} from "./helpers";

/**
 * Jalan di project "pengaturan" (setelah semua tes admin), serial: mengubah identitas/ongkir/rekening GLOBAL toko.
 */
test.describe.configure({ mode: "serial" });

const nilai = (key: string) =>
  query<{ value: string }>("SELECT value FROM Setting WHERE key = ?", key)[0]?.value ?? "";
const form = (page: Page) => page.getByRole("form", { name: "Form pengaturan toko" });
const simpan = async (page: Page) =>
  Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes("/admin/pengaturan"),
    ),
    page.getByRole("button", { name: "Simpan pengaturan" }).click(),
  ]);

async function ringkas(request: APIRequestContext, kota: string) {
  const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 50 }] });
  const [vid] = idVarian(p.id);
  const r = await request.post("/api/checkout/ringkasan", {
    data: { items: [{ varianId: vid!, qty: 1 }], kota },
    headers: { "x-forwarded-for": uniqueIp() },
  });
  return (await r.json()).ringkasan as { ongkir: number; total: number };
}

test("ADMIN mengubah identitas, WhatsApp, rekening, ongkir, QRIS → langsung berlaku di toko, checkout, konfirmasi, dan invoice", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/pengaturan");
  const f = form(page);
  await f.getByLabel("Nama toko").fill("Toko Uji Baru");
  await f.getByLabel("Tagline").fill("Tagline uji baru");
  await f.getByLabel("Nomor WhatsApp").fill("0812-9999-0001");
  await f.getByLabel("Alamat toko").fill("Jl. Uji No. 1, Bantul");
  await f.getByLabel("Catatan pembayaran").fill("Transfer lalu unggah bukti.");
  // rekening: ganti seluruhnya
  while ((await f.getByTestId("baris-rekening").count()) > 0)
    await f
      .getByTestId("baris-rekening")
      .first()
      .getByRole("button", { name: /Hapus rekening/ })
      .click();
  await f.getByRole("button", { name: "+ Tambah rekening" }).click();
  const r0 = f.getByTestId("baris-rekening").first();
  await r0.getByLabel("Bank").fill("Bank Uji");
  await r0.getByLabel("Nomor rekening").fill("1111 2222 33");
  await r0.getByLabel("Atas nama").fill("Toko Uji Baru");
  // ongkir: bawaan 33.000; kota: Bantul 7.000, tambah Klaten 9.000, hapus semua lainnya
  await f.getByLabel("Tarif bawaan (Rp)").fill("33000");
  while ((await f.getByTestId("baris-kota").count()) > 0)
    await f
      .getByTestId("baris-kota")
      .first()
      .getByRole("button", { name: /Hapus kota/ })
      .click();
  for (const [nama, tarif] of [
    ["Kota Bantul", "7000"],
    ["Klaten", "9.000"],
  ] as const) {
    await f.getByRole("button", { name: "+ Tambah kota" }).click();
    const b = f.getByTestId("baris-kota").last();
    await b.getByLabel("Kota", { exact: true }).fill(nama);
    await b.getByLabel("Tarif (Rp)").fill(tarif);
  }
  await f.getByLabel("Gambar QRIS").setInputFiles(berkasPng("qris.png"));
  const [res] = await simpan(page);
  expect(res.status()).toBeLessThan(400);
  await expect(page.getByTestId("flash")).toHaveText("Pengaturan toko disimpan.");
  expect(nilai("toko.nama")).toBe("Toko Uji Baru");
  expect(nilai("toko.whatsapp")).toBe("6281299990001");
  expect(JSON.parse(nilai("toko.ongkir"))).toEqual({
    bawaan: 33000,
    kota: { bantul: 7000, klaten: 9000 },
  });
  expect(JSON.parse(nilai("toko.rekening"))).toEqual([
    { bank: "Bank Uji", nomor: "1111 2222 33", atasNama: "Toko Uji Baru" },
  ]);
  expect(nilai("toko.qris")).toMatch(/^\/uploads\/[A-Za-z0-9_-]{16,64}\.png$/);

  // berlaku di toko
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toko Uji Baru");
  await expect(page.getByRole("link", { name: "Chat via WhatsApp" })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/6281299990001/,
  );
  await expect(page.getByRole("contentinfo")).toContainText("Toko Uji Baru");
  // ongkir mengikuti tabel baru (dihitung server)
  expect((await ringkas(request, "Bantul")).ongkir).toBe(7000);
  expect((await ringkas(request, "kota bantul")).ongkir).toBe(7000);
  expect((await ringkas(request, "Klaten")).ongkir).toBe(9000);
  expect((await ringkas(request, "Yogyakarta")).ongkir).toBe(33000); // tarif lama sudah dihapus → bawaan baru
  // checkout & konfirmasi memakai rekening + QRIS baru
  const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 5 }] });
  await page.goto(`/produk/${p.slug}`);
  await page.getByTestId("tambah-keranjang").click();
  await page.goto("/checkout");
  await page.getByLabel(/Nama lengkap/).fill("Pembeli Pengaturan");
  await page.getByLabel(/No\. HP/).fill(teleponAcak());
  await page.getByLabel(/Alamat lengkap/).fill("Jl. Mawar No. 1, Klaten");
  await page.getByLabel(/Kota/).fill("Klaten");
  await expect(page.getByTestId("co-ongkir")).toContainText("9.000");
  await page.getByTestId("buat-pesanan").click();
  await expect(page.getByTestId("daftar-rekening")).toContainText("Bank Uji");
  await expect(page.getByTestId("daftar-rekening")).not.toContainText("Bank Nusantara");
  await expect(page.getByAltText(/QRIS/)).toHaveAttribute("src", nilai("toko.qris"));
  const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
  // invoice memakai identitas baru
  const id = query<{ id: number }>('SELECT id FROM "Order" WHERE code = ?', kode)[0]!.id;
  await page.goto(`/admin/pesanan/${id}/invoice`);
  await expect(page.getByTestId("inv-toko")).toHaveText("Toko Uji Baru");
  await expect(page.getByTestId("invoice")).toContainText("Bank Uji");
  await expect(page.getByTestId("invoice")).toContainText("+6281299990001");
});

test("ganti & hapus QRIS: berkas lama dibersihkan hanya bila tak dirujuk; WA dikosongkan menyembunyikan tombol WhatsApp", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/pengaturan");
  const lama = nilai("toko.qris");
  expect(lama).toMatch(/^\/uploads\//);
  expect(existsSync(`e2e-uploads/${lama.replace("/uploads/", "")}`)).toBe(true);
  await form(page).getByLabel("Gambar QRIS").setInputFiles(berkasPng("baru.png"));
  await simpan(page);
  const baru = nilai("toko.qris");
  expect(baru).not.toBe(lama);
  expect(existsSync(`e2e-uploads/${lama.replace("/uploads/", "")}`)).toBe(false);
  expect(existsSync(`e2e-uploads/${baru.replace("/uploads/", "")}`)).toBe(true);
  await page.goto("/admin/pengaturan");
  await form(page).getByLabel("Nomor WhatsApp").fill("");
  await form(page).getByLabel("Hapus QRIS").check();
  await simpan(page);
  expect(nilai("toko.qris")).toBe("");
  expect(existsSync(`e2e-uploads/${baru.replace("/uploads/", "")}`)).toBe(false);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Chat via WhatsApp" })).toHaveCount(0);
});

test("validasi: isian salah → galat per-field, baris rekening/kota & isian tidak hilang, DB tidak berubah", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/pengaturan");
  const f = form(page);
  await f.evaluate((el) => ((el as HTMLFormElement).noValidate = true));
  const sebelum = {
    nama: nilai("toko.nama"),
    ongkir: nilai("toko.ongkir"),
    rek: nilai("toko.rekening"),
    wa: nilai("toko.whatsapp"),
  };
  await f.getByLabel("Nama toko").fill("ab");
  await f.getByLabel("Nomor WhatsApp").fill("021-555");
  await f.getByLabel("Tarif bawaan (Rp)").fill("-5");
  await f.getByRole("button", { name: "+ Tambah rekening" }).click();
  const r = f.getByTestId("baris-rekening").last();
  await r.getByLabel("Bank").fill("BNI");
  await r.getByLabel("Nomor rekening").fill("abc");
  await f.getByRole("button", { name: "+ Tambah kota" }).click();
  const k = f.getByTestId("baris-kota").last();
  await k.getByLabel("Kota", { exact: true }).fill("__proto__");
  await k.getByLabel("Tarif (Rp)").fill("1.5");
  await f.getByRole("button", { name: "+ Tambah kota" }).click();
  const k2 = f.getByTestId("baris-kota").last();
  await k2.getByLabel("Kota", { exact: true }).fill("Solo");
  await k2.getByLabel("Tarif (Rp)").fill("999999999");
  await simpan(page);
  await expect(page.getByText(/Nama toko minimal 3 karakter/)).toBeVisible();
  await expect(page.getByText("Nomor WhatsApp tidak valid (contoh: 081234567890).")).toBeVisible();
  await expect(page.getByText(/Nomor rekening 4–30 karakter/)).toBeVisible();
  await expect(page.getByText("Nama kota tidak diizinkan.")).toBeVisible();
  await expect(page.getByText(/Tarif: (Maksimal|Hanya angka)/).first()).toBeVisible();
  await expect(f.getByLabel("Nama toko")).toHaveValue("ab");
  await expect(f.getByTestId("baris-kota").last().getByLabel("Kota", { exact: true })).toHaveValue(
    "Solo",
  ); // baris tetap
  expect({
    nama: nilai("toko.nama"),
    ongkir: nilai("toko.ongkir"),
    rek: nilai("toko.rekening"),
    wa: nilai("toko.whatsapp"),
  }).toEqual(sebelum);
});

test("kota duplikat (setelah normalisasi) & QRIS berbahaya ditolak; HTML pada nama toko dibersihkan", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/pengaturan");
  const f = form(page);
  await f.evaluate((el) => ((el as HTMLFormElement).noValidate = true));
  for (const nama of ["Solo", "kota SOLO"]) {
    await f.getByRole("button", { name: "+ Tambah kota" }).click();
    const b = f.getByTestId("baris-kota").last();
    await b.getByLabel("Kota", { exact: true }).fill(nama);
    await b.getByLabel("Tarif (Rp)").fill("5000");
  }
  await f.getByLabel("Gambar QRIS").setInputFiles({
    name: "qris.png",
    mimeType: "image/png",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
  });
  const ongkir = nilai("toko.ongkir");
  const qris = nilai("toko.qris");
  await simpan(page);
  await expect(page.getByText("Kota ini sudah ada di daftar.")).toBeVisible();
  await expect(page.getByText(/qris\.png: /)).toBeVisible();
  expect(nilai("toko.ongkir")).toBe(ongkir);
  expect(nilai("toko.qris")).toBe(qris);
  // nama toko berisi HTML
  await page.goto("/admin/pengaturan");
  await form(page).getByLabel("Nama toko").fill("Toko <script>alert(1)</script> Aman");
  await simpan(page);
  expect(nilai("toko.nama")).not.toMatch(/[<>]/);
  await page.goto("/");
  expect(await page.locator("main script").count()).toBe(0);
});

test("pemulihan: nilai awal toko demo dikembalikan (agar tes sesudahnya stabil)", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/pengaturan");
  const f = form(page);
  await f.getByLabel("Nama toko").fill("Toko Nusantara Craft");
  await f
    .getByLabel("Tagline")
    .fill("Kopi, camilan, batik, dan kerajinan pilihan dari seluruh Nusantara");
  await f.getByLabel("Nomor WhatsApp").fill("6281234567890");
  await simpan(page);
  expect(nilai("toko.nama")).toBe("Toko Nusantara Craft");
  expect(nilai("toko.whatsapp")).toBe("6281234567890");
  void kunciBaru;
});
