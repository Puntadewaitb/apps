import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  STAFF_EMAIL,
  STAFF_PASSWORD,
  awasi,
  berkasPng,
  buatOrder,
  buatProduk,
  huruf,
  idVarian,
  login,
  query,
  stokVarian,
  teleponAcak,
  uniqueIp,
} from "./helpers";

const PNG = berkasPng().buffer;
const sku = () => `QA-${huruf()}`.toUpperCase();
const status = (id: number) =>
  query<{ status: string }>('SELECT status FROM "Order" WHERE id = ?', id)[0]!.status;

async function konteks(browser: Browser, peran?: "admin" | "staf"): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  if (peran === "admin") await login(page);
  else if (peran === "staf") await login(page, STAFF_EMAIL, STAFF_PASSWORD);
  else await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  return page;
}

test.describe("matriks otorisasi menyeluruh (anonim / STAFF / ADMIN) atas SEMUA halaman & route admin", () => {
  function daftar() {
    const p = buatProduk({});
    const kategoriId = query<{ id: number }>("SELECT id FROM Category ORDER BY id LIMIT 1")[0]!.id;
    const o = buatOrder({ proof: "" });
    return [
      // [path, STAFF boleh?]
      ["/admin", true],
      ["/admin/produk", false],
      ["/admin/produk/baru", false],
      [`/admin/produk/${p.id}`, false],
      ["/admin/kategori", false],
      [`/admin/kategori/${kategoriId}`, false],
      ["/admin/stok", true],
      ["/admin/pesanan", true],
      [`/admin/pesanan/${o.id}`, true],
      [`/admin/pesanan/${o.id}/invoice`, true],
      ["/admin/pengaturan", false],
    ] as Array<[string, boolean]>;
  }

  test("ANONIM: setiap halaman/route admin dialihkan ke login atau 401; metode tulis (POST/PUT/PATCH/DELETE) juga tidak lolos dan tidak mengubah data", async ({
    request,
  }) => {
    const halaman = daftar();
    const rute = ["/admin/pesanan/ekspor", "/admin/pesanan/bukti/1", "/api/admin/ringkasan"];
    const snapshot = () => ({
      produk: query<{ n: number }>("SELECT count(*) n FROM Product")[0]!.n,
      aktif: query<{ n: number }>("SELECT count(*) n FROM Product WHERE active = 1")[0]!.n,
      kategori: query<{ n: number }>("SELECT count(*) n FROM Category")[0]!.n,
      setting: query<{ v: string }>("SELECT group_concat(value) v FROM Setting")[0]!.v,
    });
    const sebelum = snapshot();
    for (const [u] of halaman) {
      const r = await request.get(u, { maxRedirects: 0 });
      expect([307, 308], u).toContain(r.status());
      expect(r.headers()["location"], u).toContain("/admin/login");
    }
    for (const u of rute)
      expect([307, 308, 401], u).toContain((await request.get(u, { maxRedirects: 0 })).status());
    for (const m of ["POST", "PUT", "PATCH", "DELETE"] as const)
      for (const [u] of [...halaman, ...rute.map((x) => [x] as [string])]) {
        const r = await request.fetch(u, {
          method: m,
          data: { id: 1 },
          maxRedirects: 0,
          headers: { "x-forwarded-for": uniqueIp() },
        });
        expect(r.status(), `${m} ${u}`).not.toBeLessThan(300); // tak pernah 2xx
        expect(r.status(), `${m} ${u}`).toBeLessThan(500);
      }
    expect(snapshot()).toEqual(sebelum);
  });

  test("ANONIM memutar ulang ID server action milik ADMIN (ubah aktif produk, ubah stok, ubah status) → ditolak, data tak berubah", async ({
    browser,
    request,
  }) => {
    const p = buatProduk({ varian: [{ name: "S", stock: 5 }] });
    const [vid] = idVarian(p.id);
    const o = buatOrder({ status: "MENUNGGU_BAYAR" });
    const admin = await konteks(browser, "admin");
    const ambil = async (u: string) => {
      await admin.goto(u);
      return /name="\$ACTION_ID_([0-9a-f]+)"/.exec(await admin.content())![1]!;
    };
    const aksiProduk = await ambil("/admin/produk");
    const aksiStok = await ambil(`/admin/stok?q=${encodeURIComponent(p.name)}`);
    const aksiStatus = await ambil(`/admin/pesanan/${o.id}`);
    const tembak = (u: string, aksi: string, f: Record<string, string>) =>
      request.post(u, {
        multipart: { [`$ACTION_ID_${aksi}`]: "", ...f },
        maxRedirects: 0,
        headers: { "x-forwarded-for": uniqueIp() },
      });
    await tembak("/admin/produk", aksiProduk, { id: String(p.id) });
    await tembak("/admin/stok", aksiStok, { id: String(vid), delta: "+100" });
    await tembak(`/admin/pesanan/${o.id}`, aksiStatus, {
      id: String(o.id),
      dari: "MENUNGGU_BAYAR",
      ke: "DIBAYAR",
    });
    expect(
      query<{ active: number }>("SELECT active FROM Product WHERE id = ?", p.id)[0]!.active,
    ).toBe(1);
    expect(stokVarian(vid!)).toBe(5);
    expect(status(o.id)).toBe("MENUNGGU_BAYAR");
  });

  test("STAFF: hanya ringkasan/stok/pesanan (halaman → 200; lainnya → /admin?akses=ditolak); ekspor CSV 403; bukti boleh", async ({
    browser,
  }) => {
    const halaman = daftar();
    const staf = await konteks(browser, "staf");
    for (const [u, boleh] of halaman) {
      const r = await staf.goto(u);
      if (boleh) {
        expect(r?.status(), u).toBe(200);
        expect(staf.url(), u).toContain(u.split("?")[0]!);
      } else expect(staf.url(), u).toContain("/admin?akses=ditolak");
    }
    expect((await staf.request.get("/admin/pesanan/ekspor")).status()).toBe(403);
    expect((await staf.request.get("/api/admin/ringkasan")).status()).toBe(200);
    const o = buatOrder({ proof: "" });
    expect([200, 404]).toContain((await staf.request.get(`/admin/pesanan/bukti/${o.id}`)).status());
  });

  test("ADMIN: semua halaman terbuka tanpa error konsol/JS dan tanpa 500, juga dengan parameter query sampah", async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const halaman = daftar();
    const admin = await konteks(browser, "admin");
    const p = await awasi(admin);
    for (const [u] of halaman) {
      const r = await admin.goto(u);
      expect(r?.status(), u).toBe(200);
      for (const q of [
        "?q=%27%22%3C%3E",
        "?halaman=-1",
        "?status=%00",
        "?ok=<script>",
        "?galat=__proto__",
        `?q=${"a".repeat(2000)}`,
      ]) {
        const rr = await admin.goto(`${u.split("?")[0]}${q}`);
        expect(rr?.status(), `${u}${q}`).toBeLessThan(500);
      }
    }
    expect((await admin.request.get("/admin/pesanan/ekspor")).status()).toBe(200);
    expect(
      p.masalah.filter((m) => !/Failed to load resource|404|400/.test(m)),
      p.masalah.join("\n"),
    ).toEqual([]);
    expect(p.luar).toEqual([]);
  });
});

test.describe("alur lengkap lintas peran", () => {
  test("admin membuat produk → pembeli menelusuri, checkout dgn voucher, lacak & unggah bukti → admin verifikasi & proses sampai selesai → pembeli melihat 'Selesai'; invoice, CSV, dasbor, stok konsisten", async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const admin = await konteks(browser, "admin");
    const pembeli = await konteks(browser);
    const pantau = await awasi(pembeli);
    const tag = huruf();

    // 1. ADMIN: kategori + produk (2 varian, gambar)
    await admin.goto("/admin/kategori");
    const fk = admin.getByRole("form", { name: "Form kategori baru" });
    await fk.getByLabel(/Nama kategori/).fill(`Kategori QA ${tag}`);
    await Promise.all([
      admin.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes("/admin/kategori"),
      ),
      fk.getByRole("button", { name: "Simpan" }).click(),
    ]);
    const kat = query<{ slug: string }>(
      "SELECT slug FROM Category WHERE name = ?",
      `Kategori QA ${tag}`,
    )[0]!.slug;
    await admin.goto("/admin/produk/baru");
    const nama = `Produk QA ${tag}`;
    await admin.getByLabel("Nama produk").fill(nama);
    await admin.getByLabel("Kategori").selectOption({ label: `Kategori QA ${tag}` });
    await admin.getByLabel(/Harga dasar/).fill("80.000");
    await admin.getByLabel("Deskripsi").fill("Produk uji alur lengkap lintas peran.");
    const v = (i: number) => admin.getByTestId("baris-varian").nth(i);
    await v(0).getByLabel("Nama varian").fill("Kecil");
    await v(0).getByLabel("SKU").fill(sku());
    await v(0).getByLabel("Stok awal").fill("10");
    await admin.getByRole("button", { name: "+ Tambah varian" }).click();
    await v(1).getByLabel("Nama varian").fill("Besar");
    await v(1).getByLabel("SKU").fill(sku());
    await v(1)
      .getByLabel(/Harga varian/)
      .fill("120000");
    await v(1).getByLabel("Stok awal").fill("5");
    await admin.getByLabel("Gambar utama").setInputFiles(berkasPng("qa.png"));
    await Promise.all([
      admin.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes("/admin/produk"),
      ),
      admin.getByRole("button", { name: "Simpan" }).click(),
    ]);
    const prod = query<{ id: number; slug: string }>(
      "SELECT id, slug FROM Product WHERE name = ?",
      nama,
    )[0]!;
    const [vKecil] = idVarian(prod.id);

    // 2. PEMBELI: telusuri per kategori → detail → pilih varian → keranjang
    await pembeli.goto(`/produk?kategori=${kat}`);
    await expect(pembeli.getByTestId("kartu-produk")).toHaveCount(1);
    await pembeli.getByRole("link", { name: nama }).click();
    await expect(pembeli.getByRole("heading", { level: 1 })).toHaveText(nama);
    await pembeli.getByLabel("Jumlah", { exact: true }).fill("2");
    await pembeli.getByTestId("tambah-keranjang").click();
    await expect(pembeli.getByTestId("jumlah-keranjang")).toHaveText("2");
    await pembeli.getByTestId("tombol-keranjang").click();
    await expect(pembeli.getByTestId("mini-subtotal")).toContainText("160.000");
    await pembeli.getByTestId("mini-cart").getByRole("link", { name: "Lihat keranjang" }).click();
    await expect(pembeli.getByTestId("subtotal")).toContainText("160.000");
    await pembeli.getByTestId("ke-checkout").click();

    // 3. CHECKOUT dengan voucher HEMAT10 (10% dari 160.000 = 16.000) + ongkir Yogyakarta 10.000 → 154.000
    const hp = teleponAcak();
    await pembeli.getByLabel(/Nama lengkap/).fill("Pembeli QA");
    await pembeli.getByLabel(/No\. HP/).fill(hp);
    await pembeli.getByLabel(/Alamat lengkap/).fill("Jl. QA No. 1, Sleman, Yogyakarta");
    await pembeli.getByLabel(/Kota/).fill("Yogyakarta");
    await pembeli.getByLabel("Kode voucher").fill("HEMAT10");
    await pembeli.getByRole("button", { name: "Terapkan" }).click();
    await expect(pembeli.getByTestId("co-total")).toContainText("154.000");
    await pembeli.getByTestId("buat-pesanan").click();
    const kode = (await pembeli.getByTestId("kode-pesanan").textContent())!.trim();
    const o = query<{ id: number; total: number; discount: number }>(
      'SELECT id, total, discount FROM "Order" WHERE code = ?',
      kode,
    )[0]!;
    expect(o).toMatchObject({ total: 154_000, discount: 16_000 });
    expect(stokVarian(vKecil!)).toBe(8);

    // 4. PEMBELI: lacak + unggah bukti
    await pembeli.getByTestId("ke-lacak").click();
    await pembeli.getByLabel(/No\. HP/).fill(hp);
    await pembeli.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(pembeli.getByTestId("status-label")).toHaveText("Status: Menunggu pembayaran");
    await pembeli
      .getByLabel("Unggah bukti bayar")
      .setInputFiles({ name: "bukti.png", mimeType: "image/png", buffer: PNG });
    await pembeli.getByRole("button", { name: "Kirim bukti" }).click();
    await expect(pembeli.getByTestId("status-bukti")).toContainText("berhasil");

    // 5. ADMIN: cari pesanan, periksa bukti, proses sampai selesai
    await admin.goto(`/admin/pesanan?q=${kode}`);
    await expect(admin.getByTestId("baris-pesanan")).toHaveCount(1);
    await admin.getByRole("link", { name: kode }).click();
    await expect(admin.getByTestId("link-bukti")).toBeVisible();
    expect((await admin.request.get(`/admin/pesanan/bukti/${o.id}`)).status()).toBe(200);
    for (const [ke, label] of [
      ["DIBAYAR", "Sudah dibayar"],
      ["DIPROSES", "Sedang diproses"],
      ["DIKIRIM", "Dikirim"],
      ["SELESAI", "Selesai"],
    ] as const) {
      await admin.getByTestId(`ke-${ke}`).click();
      await expect(admin.getByTestId("status-saat-ini")).toContainText(label);
    }
    expect(status(o.id)).toBe("SELESAI");

    // 6. PEMBELI melihat "Selesai"
    await pembeli.reload();
    await pembeli.getByLabel(/No\. HP/).fill(hp);
    await pembeli.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(pembeli.getByTestId("status-label")).toHaveText("Status: Selesai");
    await expect(pembeli.getByRole("button", { name: "Kirim bukti" })).toHaveCount(0);

    // 7. ADMIN: invoice, CSV, dasbor
    await admin.goto(`/admin/pesanan/${o.id}/invoice`);
    await expect(admin.getByTestId("inv-status")).toHaveText("LUNAS");
    await expect(admin.getByTestId("inv-total")).toContainText("154.000");
    await expect(admin.getByTestId("invoice")).toContainText(nama);
    const csv = await (await admin.request.get("/admin/pesanan/ekspor?status=SELESAI")).text();
    expect(csv).toContain(kode);
    expect(csv).toContain("154000");
    await admin.goto("/admin");
    expect(
      Number((await admin.getByTestId("nilai-omzet-hari-ini").textContent())!.replace(/\D/g, "")),
    ).toBeGreaterThanOrEqual(154_000);

    // 8. Seluruh alur pembeli bersih dari error konsol/CSP/permintaan luar
    expect(pantau.masalah, pantau.masalah.join("\n")).toEqual([]);
    expect(pantau.luar).toEqual([]);
  });

  test("pesanan dibatalkan admin: stok & voucher kembali, pembeli melihat 'Dibatalkan', tidak bisa unggah bukti lagi", async ({
    browser,
    request,
  }) => {
    const p = buatProduk({ price: 100_000, varian: [{ name: "Standar", stock: 6 }] });
    const [vid] = idVarian(p.id);
    const items = [{ varianId: vid!, qty: 2 }];
    const ring = await request.post("/api/checkout/ringkasan", {
      data: { items, kota: "Yogyakarta" },
      headers: { "x-forwarded-for": uniqueIp() },
    });
    const hp = teleponAcak();
    const r = await request.post("/api/pesanan", {
      data: {
        kunci: `${huruf()}${huruf()}${huruf()}`.padEnd(16, "k"),
        items,
        nama: "Pembeli Batal",
        telepon: hp,
        alamat: "Jl. Batal No. 1, Sleman",
        kota: "Yogyakarta",
        totalPreview: (await ring.json()).ringkasan.total,
      },
      headers: { "x-forwarded-for": uniqueIp() },
    });
    expect(r.status()).toBe(200);
    const { kode } = await r.json();
    expect(stokVarian(vid!)).toBe(4);
    const admin = await konteks(browser, "admin");
    const id = query<{ id: number }>('SELECT id FROM "Order" WHERE code = ?', kode)[0]!.id;
    await admin.goto(`/admin/pesanan/${id}`);
    await admin.getByTestId("ke-DIBATALKAN").click();
    await expect(admin.getByTestId("status-saat-ini")).toContainText("Dibatalkan");
    expect(stokVarian(vid!)).toBe(6);
    const pembeli = await konteks(browser);
    await pembeli.goto(`/lacak?kode=${kode}`);
    await pembeli.getByLabel(/No\. HP/).fill(hp);
    await pembeli.getByRole("button", { name: "Cek pesanan" }).click();
    await expect(pembeli.getByTestId("status-batal")).toBeVisible();
    await expect(pembeli.getByRole("button", { name: "Kirim bukti" })).toHaveCount(0);
    const up = await pembeli.request.post("/api/lacak/bukti", {
      multipart: {
        kode,
        telepon: hp,
        berkas: { name: "x.png", mimeType: "image/png", buffer: PNG },
      },
    });
    expect(up.status()).toBe(409);
  });
});
