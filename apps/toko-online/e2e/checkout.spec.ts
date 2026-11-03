import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  ambilOrder,
  awasi,
  buatProduk,
  idVarian,
  kunciBaru,
  query,
  stokVarian,
  teleponAcak,
  tulis,
  uniqueIp,
  dbDate,
} from "./helpers";

/** Jumlah order yang memuat produk tertentu (terlindung dari tes paralel yang membuat order lain). */
const orderProduk = (produkId: number) =>
  query<{ c: number }>(
    "SELECT count(DISTINCT orderId) c FROM OrderItem WHERE productId = ?",
    produkId,
  )[0]!.c;

const KODE = /^TKO-[2-9A-HJKMNP-Z]{8}$/;

const dasar = (
  items: Array<{ varianId: number; qty: number }>,
  o: Record<string, unknown> = {},
) => ({
  kunci: kunciBaru(),
  items,
  nama: "Budi Santoso",
  telepon: teleponAcak(),
  alamat: "Jl. Mawar No. 1, Sleman, Yogyakarta",
  kota: "Yogyakarta",
  totalPreview: 0,
  ...o,
});
const pesan = (request: APIRequestContext, body: unknown, headers: Record<string, string> = {}) =>
  request.post("/api/pesanan", {
    data: body,
    headers: { "x-forwarded-for": uniqueIp(), ...headers },
  });
const ringkas = (request: APIRequestContext, body: unknown, ip = uniqueIp()) =>
  request.post("/api/checkout/ringkasan", { data: body, headers: { "x-forwarded-for": ip } });
/** Total yang benar menurut server (untuk dipakai sebagai totalPreview yang jujur). */
const totalServer = async (
  request: APIRequestContext,
  items: Array<{ varianId: number; qty: number }>,
  kota = "Yogyakarta",
  voucher = "",
) =>
  (
    (await (await ringkas(request, { items, kota, voucher })).json()) as {
      ringkasan: { total: number };
    }
  ).ringkasan.total;

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

async function isiForm(
  page: Page,
  o: {
    nama?: string;
    telepon?: string;
    alamat?: string;
    kota?: string;
    catatan?: string;
    email?: string;
  } = {},
) {
  await page.getByLabel(/Nama lengkap/).fill(o.nama ?? "Siti Aminah");
  await page.getByLabel(/No\. HP/).fill(o.telepon ?? teleponAcak());
  if (o.email) await page.getByLabel(/Email/).fill(o.email);
  await page.getByLabel(/Alamat lengkap/).fill(o.alamat ?? "Jl. Kenanga No. 7, Sleman");
  await page.getByLabel(/Kota/).fill(o.kota ?? "Yogyakarta");
  if (o.catatan) await page.getByLabel(/Catatan/).fill(o.catatan);
}
async function keCheckout(page: Page, slug: string, jumlah = 1) {
  await page.goto(`/produk/${slug}`);
  if (jumlah > 1) await page.getByLabel("Jumlah", { exact: true }).fill(String(jumlah));
  await page.getByTestId("tambah-keranjang").click();
  await expect(page.getByTestId("pesan-keranjang")).not.toBeEmpty();
  await page.goto("/checkout");
  await expect(page.getByTestId("co-total")).toBeVisible();
}

test.describe("alur checkout (UI)", () => {
  test("pesan sampai konfirmasi: total benar, order & item tersimpan (snapshot), stok terkunci, keranjang kosong, tautan WhatsApp", async ({
    page,
  }) => {
    const p = buatProduk({
      price: 50_000,
      name: `Barang ${Date.now()}`,
      varian: [{ name: "Standar", stock: 10 }],
    });
    const [vid] = idVarian(p.id);
    const peta = await awasi(page);
    await keCheckout(page, p.slug, 3);
    await expect(page.getByTestId("co-subtotal")).toContainText("150.000");
    await expect(page.getByTestId("co-ongkir")).toContainText("25.000"); // bawaan sebelum kota diisi
    await isiForm(page, {
      nama: "Siti Aminah",
      telepon: "0812-3456-7777",
      kota: "Kota Yogyakarta",
      catatan: "Tolong bungkus rapi",
      email: "Siti@Contoh.test",
    });
    await expect(page.getByTestId("co-ongkir")).toContainText("10.000");
    await expect(page.getByTestId("co-total")).toContainText("160.000");
    await page.getByTestId("buat-pesanan").click();
    const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
    expect(kode).toMatch(KODE);
    await expect(page.getByTestId("total-bayar")).toContainText("160.000");
    await expect(page.getByTestId("daftar-rekening")).toContainText("Bank Nusantara");
    await expect(page.getByAltText(/QRIS/)).toBeVisible();
    // tautan WhatsApp: nomor toko + pesan berisi kode & total
    const wa = (await page.getByTestId("kirim-wa").getAttribute("href"))!;
    expect(wa.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
    const teks = decodeURIComponent(wa.split("?text=")[1]!);
    expect(teks).toContain(kode);
    expect(teks).toContain("TOTAL: Rp");
    expect(teks).toContain("160.000");
    await expect(page.getByTestId("kirim-wa")).toHaveAttribute("rel", /noopener/);
    // DB
    const o = ambilOrder(kode)!;
    expect(o).toMatchObject({
      status: "MENUNGGU_BAYAR",
      customerName: "Siti Aminah",
      customerPhone: "6281234567777",
      customerEmail: "siti@contoh.test",
      city: "Kota Yogyakarta",
      note: "Tolong bungkus rapi",
      subtotal: 150_000,
      shippingCost: 10_000,
      discount: 0,
      total: 160_000,
      voucherCode: "",
      paymentProof: "",
    });
    const item = query<{
      productName: string;
      unitPrice: number;
      qty: number;
      lineTotal: number;
      variantId: number;
    }>("SELECT * FROM OrderItem WHERE orderId = ?", o.id);
    expect(item).toEqual([
      expect.objectContaining({
        productName: p.name,
        unitPrice: 50_000,
        qty: 3,
        lineTotal: 150_000,
        variantId: vid,
      }),
    ]);
    expect(stokVarian(vid!)).toBe(7);
    // keranjang dikosongkan; reload → keranjang kosong, pesanan tidak terkirim ulang
    expect(await page.evaluate(() => localStorage.getItem("toko.keranjang.v1"))).toBeNull();
    await page.reload();
    await expect(page.getByTestId("checkout-kosong")).toBeVisible();
    expect(
      query(
        "SELECT 1 FROM \"Order\" WHERE customerName = 'Siti Aminah' AND customerPhone = '6281234567777'",
      ),
    ).toHaveLength(1);
    expect(peta.masalah).toEqual([]);
    expect(peta.luar).toEqual([]);
  });

  test("snapshot: harga produk diubah SETELAH order tidak mengubah order lama", async ({
    page,
  }) => {
    const p = buatProduk({ price: 20_000, varian: [{ name: "Standar", stock: 5 }] });
    await keCheckout(page, p.slug);
    await isiForm(page);
    await page.getByTestId("buat-pesanan").click();
    const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
    tulis((d) =>
      d.prepare("UPDATE Product SET price = 99999, name = 'Diganti' WHERE id = ?").run(p.id),
    );
    const o = ambilOrder(kode)!;
    expect(o.subtotal).toBe(20_000);
    const it = query<{ productName: string; unitPrice: number }>(
      "SELECT productName, unitPrice FROM OrderItem WHERE orderId = ?",
      o.id,
    )[0]!;
    expect(it).toEqual({ productName: p.name, unitPrice: 20_000 });
  });

  test("ongkir: tabel kota (tanpa membedakan huruf/awalan), kota lain → tarif bawaan; berubah langsung saat kota diubah", async ({
    page,
  }) => {
    const p = buatProduk({ price: 10_000 });
    await keCheckout(page, p.slug);
    for (const [kota, ongkir] of [
      ["jakarta", "18.000"],
      ["KOTA BANDUNG", "18.000"],
      ["Surabaya", "20.000"],
      ["Medan", "25.000"],
      ["constructor", "25.000"],
      ["__proto__", "25.000"],
    ] as const) {
      await page.getByLabel(/Kota/).fill(kota);
      await expect(page.getByTestId("co-ongkir"), kota).toContainText(ongkir);
    }
  });

  test("voucher: HEMAT10 (10%, maks 50rb), POTONG25K (nominal, min 200rb); diterapkan/dihapus; kuota terpakai setelah order", async ({
    page,
  }) => {
    const p = buatProduk({ price: 300_000, varian: [{ name: "Standar", stock: 20 }] });
    await keCheckout(page, p.slug);
    await page.getByLabel(/Kota/).fill("Yogyakarta");
    await page.getByLabel("Kode voucher").fill("hemat10");
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page.getByTestId("status-voucher")).toContainText("HEMAT10 diterapkan");
    await expect(page.getByTestId("co-diskon")).toContainText("30.000"); // 10% × 300.000
    await expect(page.getByTestId("co-total")).toContainText("280.000"); // 300.000 + 10.000 − 30.000
    await page.getByRole("button", { name: "Hapus voucher" }).click();
    await expect(page.getByTestId("co-diskon")).toHaveCount(0);
    await page.getByLabel("Kode voucher").fill("POTONG25K");
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page.getByTestId("co-diskon")).toContainText("25.000");
    const sebelum = query<{ used: number }>("SELECT used FROM Voucher WHERE code = 'POTONG25K'")[0]!
      .used;
    await isiForm(page);
    await page.getByTestId("buat-pesanan").click();
    const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
    expect(ambilOrder(kode)).toMatchObject({
      discount: 25_000,
      total: 285_000,
      voucherCode: "POTONG25K",
    });
    expect(
      query<{ used: number }>("SELECT used FROM Voucher WHERE code = 'POTONG25K'")[0]!.used,
    ).toBe(sebelum + 1);
  });

  test("voucher tidak valid: pesan generik (tidak membedakan tidak ada/nonaktif/kedaluwarsa), minimal belanja & kuota habis spesifik; tombol pesan nonaktif", async ({
    page,
  }) => {
    const p = buatProduk({ price: 50_000 });
    await keCheckout(page, p.slug);
    const pesan: string[] = [];
    for (const kode of ["TIDAKADA", "KADALUARSA", "NONAKTIF"]) {
      await page.getByLabel("Kode voucher").fill(kode);
      await page.getByRole("button", { name: "Terapkan" }).click();
      const s = page.getByTestId("status-voucher");
      await expect(s).toContainText("tidak valid atau tidak dapat dipakai");
      pesan.push((await s.textContent())!.replace(kode, ""));
      await expect(page.getByTestId("buat-pesanan")).toBeDisabled();
      await page.getByRole("button", { name: "Hapus voucher" }).click();
    }
    expect(new Set(pesan).size).toBe(1);
    await page.getByLabel("Kode voucher").fill("HEMAT10"); // min 100.000, subtotal 50.000
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page.getByTestId("status-voucher")).toContainText("minimal Rp");
    await page.getByRole("button", { name: "Hapus voucher" }).click();
    await page.getByLabel("Kode voucher").fill("HABIS");
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page.getByTestId("status-voucher")).toContainText("Kuota voucher ini sudah habis");
    await page.getByRole("button", { name: "Hapus voucher" }).click();
    await expect(page.getByTestId("buat-pesanan")).toBeDisabled(); // kota belum diisi tidak memblokir; tombol aktif setelah ringkasan siap
  });

  test("validasi: isian kosong/salah → galat per-field, isian tidak hilang, tidak ada pesanan", async ({
    page,
  }) => {
    const p = buatProduk();
    const sebelum = orderProduk(p.id);
    await keCheckout(page, p.slug);
    await page.getByTestId("buat-pesanan").click();
    await expect(page.getByTestId("galat-umum")).toBeVisible();
    for (const label of [/Nama lengkap/, /No\. HP/, /Alamat lengkap/, /Kota/])
      await expect(page.getByLabel(label)).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel(/Nama lengkap/).fill("Budi");
    await page.getByLabel(/No\. HP/).fill("12345");
    await page.getByLabel(/Alamat lengkap/).fill("Jl. Mawar No. 1, Sleman");
    await page.getByLabel(/Kota/).fill("Sleman");
    await page.getByTestId("buat-pesanan").click();
    await expect(page.getByText("Nomor HP tidak valid")).toBeVisible();
    await expect(page.getByLabel(/Nama lengkap/)).toHaveValue("Budi"); // isian tetap
    await expect(page.getByLabel(/Alamat lengkap/)).toHaveValue("Jl. Mawar No. 1, Sleman");
    expect(orderProduk(p.id)).toBe(sebelum);
  });

  test("harga berubah di server setelah ringkasan tampil → pesanan DITOLAK, ringkasan diperbarui; kirim ulang berhasil dengan harga baru", async ({
    page,
  }) => {
    const p = buatProduk({ price: 40_000, varian: [{ name: "Standar", stock: 5 }] });
    const [vid] = idVarian(p.id);
    await keCheckout(page, p.slug);
    await isiForm(page);
    await expect(page.getByTestId("co-total")).toContainText("50.000");
    tulis((d) => d.prepare("UPDATE Product SET price = 60000 WHERE id = ?").run(p.id));
    await page.getByTestId("buat-pesanan").click();
    await expect(page.getByTestId("galat-umum")).toContainText("berubah");
    await expect(page.getByTestId("co-total")).toContainText("70.000");
    expect(stokVarian(vid!)).toBe(5); // tidak ada stok terkunci
    await page.getByTestId("buat-pesanan").click();
    const kode = (await page.getByTestId("kode-pesanan").textContent())!.trim();
    expect(ambilOrder(kode)).toMatchObject({ subtotal: 60_000, total: 70_000 });
    expect(stokVarian(vid!)).toBe(4);
  });

  test("stok berkurang setelah masuk keranjang → ringkasan menandai, tombol nonaktif, tidak ada pesanan", async ({
    page,
  }) => {
    const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 10 }] });
    await keCheckout(page, p.slug, 5);
    tulis((d) => d.prepare("UPDATE Variant SET stock = 2 WHERE productId = ?").run(p.id));
    await page.reload();
    await expect(page.getByText("Stok tersisa 2").first()).toBeVisible();
    await expect(page.getByTestId("buat-pesanan")).toBeDisabled();
    await expect(page.getByRole("link", { name: "Perbaiki keranjang" })).toHaveAttribute(
      "href",
      "/keranjang",
    );
  });

  test("keranjang kosong → pesan kosong; honeypot terisi → tampak sukses tetapi tidak ada pesanan & stok utuh", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await expect(page.getByTestId("checkout-kosong")).toBeVisible();
    const p = buatProduk({ varian: [{ name: "Standar", stock: 5 }] });
    const [vid] = idVarian(p.id);
    const sebelum = orderProduk(p.id);
    await keCheckout(page, p.slug);
    await isiForm(page, { nama: "Bot Spam" });
    await page
      .locator('input[name="website_url"]')
      .evaluate((e: HTMLInputElement) => (e.value = "http://spam.test"));
    await page.getByTestId("buat-pesanan").click();
    await expect(page.getByTestId("kode-pesanan")).toBeVisible();
    expect(orderProduk(p.id)).toBe(sebelum);
    expect(stokVarian(vid!)).toBe(5);
  });

  test("a11y & responsif: label, heading berurutan, honeypot tak terjangkau keyboard, tanpa overflow 360px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const p = buatProduk({ name: `Z${"Y".repeat(90)}` });
    await keCheckout(page, p.slug);
    await isiForm(page, { alamat: "A".repeat(120) });
    const levels = await page
      .locator("h1,h2,h3")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    for (const e of await page.locator("form input:visible, form textarea:visible").all()) {
      const n = await e.evaluate((el) => (el as HTMLInputElement).labels?.length ?? 0);
      expect(n, await e.evaluate((el) => el.outerHTML.slice(0, 80))).toBeGreaterThan(0);
    }
    expect(await page.locator('input[name="website_url"]').getAttribute("tabindex")).toBe("-1");
    await expect(page.locator('input[name="website_url"]')).not.toBeInViewport();
  });
});

test.describe("keamanan checkout (API)", () => {
  test("manipulasi harga: properti harga/total/ongkir/diskon/subtotal/stok dari klien DITOLAK (400), tidak ada pesanan", async ({
    request,
  }) => {
    const p = buatProduk({ price: 100_000, varian: [{ name: "Standar", stock: 5 }] });
    const [vid] = idVarian(p.id);
    const sebelum = orderProduk(p.id);
    for (const k of [
      "harga",
      "total",
      "ongkir",
      "diskon",
      "subtotal",
      "stok",
      "status",
      "shippingCost",
      "unitPrice",
    ]) {
      const r = await pesan(
        request,
        dasar([{ varianId: vid!, qty: 1 }], { [k]: 1, totalPreview: 110_000 }),
      );
      expect(r.status(), k).toBe(400);
    }
    const r = await pesan(
      request,
      dasar([{ varianId: vid!, qty: 1, harga: 1 } as never], { totalPreview: 1 }),
    );
    expect(r.status()).toBe(400);
    expect(orderProduk(p.id)).toBe(sebelum);
    expect(stokVarian(vid!)).toBe(5);
  });

  test("totalPreview palsu (mis. 1) tidak bisa menurunkan harga: ditolak 409; harga tersimpan selalu dari server", async ({
    request,
  }) => {
    const p = buatProduk({ price: 100_000, varian: [{ name: "Standar", stock: 5 }] });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 2 }];
    for (const palsu of [1, 0, 199_999, 210_001, 5_000_000]) {
      const r = await pesan(request, dasar(items, { totalPreview: palsu }));
      expect(r.status(), String(palsu)).toBe(409);
      expect((await r.json()).jenis).toBe("harga-berubah");
    }
    expect(stokVarian(vid!)).toBe(5);
    const benar = await totalServer(request, items);
    expect(benar).toBe(210_000); // 200.000 + ongkir Yogyakarta 10.000
    const ok = await pesan(request, dasar(items, { totalPreview: benar }));
    expect(ok.status()).toBe(200);
    const j = await ok.json();
    expect(j.kode).toMatch(KODE);
    expect(ambilOrder(j.kode)).toMatchObject({
      subtotal: 200_000,
      shippingCost: 10_000,
      total: 210_000,
    });
    expect(stokVarian(vid!)).toBe(3);
  });

  test("qty melebihi stok / varian nonaktif / produk nonaktif / id fiktif → ditolak, stok & order tidak berubah", async ({
    request,
  }) => {
    const a = buatProduk({
      varian: [
        { name: "A", stock: 2 },
        { name: "Mati", stock: 9, active: false },
      ],
    });
    const mati = buatProduk({ active: false });
    const [va, vmati] = idVarian(a.id);
    const [vp] = idVarian(mati.id);
    const sebelum = orderProduk(a.id);
    for (const items of [
      [{ varianId: va!, qty: 3 }],
      [{ varianId: vmati!, qty: 1 }],
      [{ varianId: vp!, qty: 1 }],
      [{ varianId: 99_999_999, qty: 1 }],
      [
        { varianId: va!, qty: 1 },
        { varianId: 99_999_999, qty: 1 },
      ],
    ]) {
      const r = await pesan(request, dasar(items, { totalPreview: 0 }));
      expect(r.status(), JSON.stringify(items)).toBe(422);
    }
    expect(stokVarian(va!)).toBe(2);
    expect(orderProduk(a.id)).toBe(sebelum);
  });

  test("input tidak sah: qty 0/negatif/pecahan/besar, item kosong, tipe salah → 400", async ({
    request,
  }) => {
    const p = buatProduk();
    const [vid] = idVarian(p.id);
    for (const items of [
      [],
      [{ varianId: vid!, qty: 0 }],
      [{ varianId: vid!, qty: -2 }],
      [{ varianId: vid!, qty: 1.5 }],
      [{ varianId: vid!, qty: 100 }],
      [{ varianId: String(vid), qty: 1 }],
      "bukan-array",
      null,
    ]) {
      const r = await pesan(request, dasar(items as never));
      expect(r.status(), JSON.stringify(items)).toBe(400);
    }
    for (const [k, v] of [
      ["nama", "<script>x</script>"],
      ["telepon", "021555"],
      ["kota", "a"],
      ["alamat", "pendek"],
      ["email", "x"],
      ["kunci", "pendek"],
    ] as const) {
      const r = await pesan(request, dasar([{ varianId: vid!, qty: 1 }], { [k]: v }));
      expect(r.status(), k).toBe(400);
      expect(Object.keys((await r.json()).field)).toContain(k);
    }
  });

  test("total melebihi batas → ditolak; voucher injeksi/aneh tidak menimbulkan error", async ({
    request,
  }) => {
    const p = buatProduk({ price: 900_000_000, varian: [{ name: "Standar", stock: 10 }] });
    const [vid] = idVarian(p.id);
    const r = await pesan(
      request,
      dasar([{ varianId: vid!, qty: 2 }], { totalPreview: 1_800_025_000 }),
    );
    expect(r.status()).toBe(422);
    expect((await r.json()).pesan).toContain("terlalu besar");
    expect(stokVarian(vid!)).toBe(10);
    const q = buatProduk({ price: 10_000 });
    const [vq] = idVarian(q.id);
    for (const v of [
      'x\'; DROP TABLE "Order";--',
      "<script>",
      "A".repeat(40),
      "  ",
      "%",
      "hemat10 ",
      "💥",
    ]) {
      const rr = await ringkas(request, {
        items: [{ varianId: vq!, qty: 1 }],
        kota: "Sleman",
        voucher: v,
      });
      expect(rr.status(), v).toBe(200);
    }
  });

  test("idempotensi: kunci sama dikirim bersamaan & berulang → HANYA satu pesanan, kode sama, stok terkunci sekali", async ({
    request,
  }) => {
    const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 10 }] });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 2 }];
    const body = dasar(items, { totalPreview: await totalServer(request, items) });
    const hasil = await Promise.all([
      pesan(request, body),
      pesan(request, body),
      pesan(request, body),
    ]);
    const j = await Promise.all(hasil.map((r) => r.json()));
    expect(hasil.map((r) => r.status())).toEqual([200, 200, 200]);
    expect(new Set(j.map((x) => x.kode)).size).toBe(1);
    const lagi = await (await pesan(request, body)).json();
    expect(lagi.kode).toBe(j[0].kode);
    expect(query("SELECT 1 FROM OrderItem WHERE variantId = ?", vid)).toHaveLength(1);
    expect(stokVarian(vid!)).toBe(8);
  });

  test("balapan stok: 8 pesanan bersamaan untuk stok 3 → tepat 3 berhasil, stok 0 (tidak pernah negatif), sisanya 422", async ({
    request,
  }) => {
    const p = buatProduk({ price: 10_000, varian: [{ name: "Standar", stock: 3 }] });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 1 }];
    const total = await totalServer(request, items);
    const rs = await Promise.all(
      Array.from({ length: 8 }, () => pesan(request, dasar(items, { totalPreview: total }))),
    );
    const st = rs.map((r) => r.status()).sort();
    expect(st.filter((s) => s === 200)).toHaveLength(3);
    expect(st.filter((s) => s === 422)).toHaveLength(5);
    expect(stokVarian(vid!)).toBe(0);
    expect(query("SELECT 1 FROM OrderItem WHERE variantId = ?", vid)).toHaveLength(3);
  });

  test("balapan kuota voucher: kuota 2, 6 pesanan bersamaan → tepat 2 berhasil dengan diskon, used=2, stok hanya berkurang untuk yang berhasil", async ({
    request,
  }) => {
    const kode = `Q${Date.now().toString(36).toUpperCase()}`;
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Voucher (code, type, value, minSubtotal, maxDiscount, quota, used, startsAt, endsAt, active) VALUES (?, 'NOMINAL', 5000, 0, NULL, 2, 0, ?, ?, 1)",
        )
        .run(kode, dbDate(Date.now() - 86_400_000), dbDate(Date.now() + 86_400_000)),
    );
    const p = buatProduk({ price: 50_000, varian: [{ name: "Standar", stock: 20 }] });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 1 }];
    const total = await totalServer(request, items, "Yogyakarta", kode);
    expect(total).toBe(55_000); // 50.000 + 10.000 − 5.000
    const rs = await Promise.all(
      Array.from({ length: 6 }, () =>
        pesan(request, dasar(items, { voucher: kode, totalPreview: total })),
      ),
    );
    const st = rs.map((r) => r.status());
    expect(st.filter((s) => s === 200)).toHaveLength(2);
    expect(query<{ used: number }>("SELECT used FROM Voucher WHERE code = ?", kode)[0]!.used).toBe(
      2,
    );
    expect(stokVarian(vid!)).toBe(18);
    expect(query('SELECT 1 FROM "Order" WHERE voucherCode = ?', kode)).toHaveLength(2);
  });

  test("CSRF: Origin lintas-situs → 403; Content-Type form → 415; badan terlalu besar → 413; GET → 405", async ({
    request,
  }) => {
    const p = buatProduk();
    const [vid] = idVarian(p.id);
    const body = dasar([{ varianId: vid!, qty: 1 }], { totalPreview: 1 });
    expect((await pesan(request, body, { origin: "https://evil.example" })).status()).toBe(403);
    expect((await ringkas(request, { items: body.items })).status()).toBe(200);
    const evil = await request.post("/api/checkout/ringkasan", {
      data: { items: body.items },
      headers: { origin: "https://evil.example", "x-forwarded-for": uniqueIp() },
    });
    expect(evil.status()).toBe(403);
    const form = await request.post("/api/pesanan", {
      data: "nama=x",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": uniqueIp(),
      },
    });
    expect(form.status()).toBe(415);
    const besar = await request.post("/api/pesanan", {
      data: JSON.stringify({ ...body, catatan: "a".repeat(20_000) }),
      headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp() },
    });
    expect(besar.status()).toBe(413);
    for (const u of ["/api/pesanan", "/api/checkout/ringkasan"]) {
      const g = await request.get(u);
      expect(g.status()).toBe(405);
      expect(g.headers()["allow"]).toBe("POST");
    }
  });

  test("rate limit: pesanan per-nomor HP (6/jam) dan per-IP (10/jam) → 429 + Retry-After; voucher di pratinjau (20/10 mnt)", async ({
    request,
  }) => {
    const p = buatProduk({ price: 1_000, varian: [{ name: "Standar", stock: 200 }] });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 1 }];
    const total = await totalServer(request, items);
    const hp = teleponAcak();
    const st: number[] = [];
    for (let i = 0; i < 8; i++)
      st.push((await pesan(request, dasar(items, { telepon: hp, totalPreview: total }))).status());
    expect(st.filter((s) => s === 200)).toHaveLength(6);
    expect(st.filter((s) => s === 429)).toHaveLength(2);
    const ip = uniqueIp();
    const st2: number[] = [];
    let retry = "";
    for (let i = 0; i < 12; i++) {
      const r = await request.post("/api/pesanan", {
        data: dasar(items, { totalPreview: total }),
        headers: { "x-forwarded-for": ip },
      });
      st2.push(r.status());
      if (r.status() === 429) retry = r.headers()["retry-after"] ?? "";
    }
    expect(st2.filter((s) => s === 200)).toHaveLength(10);
    expect(st2.filter((s) => s === 429)).toHaveLength(2);
    expect(Number(retry)).toBeGreaterThan(0);
    // tebak voucher
    const ipv = uniqueIp();
    const sv: number[] = [];
    for (let i = 0; i < 23; i++)
      sv.push(
        (await ringkas(request, { items, kota: "Sleman", voucher: `TEBAK${i}` }, ipv)).status(),
      );
    expect(sv.filter((s) => s === 200)).toHaveLength(20);
    expect(sv.filter((s) => s === 429)).toHaveLength(3);
    expect((await ringkas(request, { items, kota: "Sleman", voucher: "" }, ipv)).status()).toBe(
      200,
    ); // tanpa voucher tidak terkena batas voucher
  });

  test("data pembeli disimpan tersanitasi (HTML dibuang), telepon dinormalkan; respons tidak membocorkan data pesanan lain", async ({
    request,
  }) => {
    const p = buatProduk({ price: 5_000 });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 1 }];
    const total = await totalServer(request, items);
    const r = await pesan(
      request,
      dasar(items, {
        totalPreview: total,
        alamat: "Jl. <img src=x onerror=alert(1)> Mawar No. 1, Sleman",
        catatan: "<script>alert(1)</script>halo",
        telepon: "+62 812-0000-1111",
      }),
    );
    expect(r.status()).toBe(200);
    const j = await r.json();
    const o = ambilOrder(j.kode)!;
    expect(String(o.address)).not.toMatch(/[<>]/);
    expect(String(o.note)).not.toMatch(/[<>]/);
    expect(o.customerPhone).toBe("6281200001111");
    const keys = Object.keys(j).sort();
    expect(keys).toEqual([
      "baris",
      "catatanBayar",
      "diskon",
      "kode",
      "ok",
      "ongkir",
      "qris",
      "rekening",
      "subtotal",
      "total",
      "waUrl",
    ]);
    expect(JSON.stringify(j)).not.toContain("6281200001111"); // tidak memantulkan nomor/alamat tersimpan selain di tautan WA (alamat pembeli sendiri)
  });

  test("ringkasan baca-saja: tidak mengubah stok, voucher, atau order", async ({ request }) => {
    // Voucher & produk milik tes ini sendiri → pembacaan tidak terganggu tes paralel.
    const kode = `R${Date.now().toString(36).toUpperCase()}`;
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Voucher (code, type, value, minSubtotal, maxDiscount, quota, used, startsAt, endsAt, active) VALUES (?, 'PERSEN', 10, 0, NULL, 5, 0, ?, ?, 1)",
        )
        .run(kode, dbDate(Date.now() - 86_400_000), dbDate(Date.now() + 86_400_000)),
    );
    const p = buatProduk({ price: 5_000, varian: [{ name: "Standar", stock: 4 }] });
    const [vid] = idVarian(p.id);
    for (let i = 0; i < 5; i++) {
      const r = await ringkas(request, {
        items: [{ varianId: vid!, qty: 2 }],
        kota: "Sleman",
        voucher: kode,
      });
      expect((await r.json()).ringkasan.voucher.ok).toBe(true); // kontrol positif: voucher memang dihitung
    }
    expect(stokVarian(vid!)).toBe(4);
    expect(query<{ used: number }>("SELECT used FROM Voucher WHERE code = ?", kode)[0]!.used).toBe(
      0,
    );
    expect(query("SELECT 1 FROM OrderItem WHERE variantId = ?", vid)).toHaveLength(0);
  });
});
