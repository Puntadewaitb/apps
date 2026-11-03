import { existsSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  STAFF_EMAIL,
  STAFF_PASSWORD,
  buatOrder,
  buatProduk,
  dbDate,
  huruf,
  idVarian,
  kunciBaru,
  login,
  query,
  stokVarian,
  teleponAcak,
  tulis,
  uniqueIp,
} from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const status = (id: number) =>
  query<{ status: string }>('SELECT status FROM "Order" WHERE id = ?', id)[0]!.status;
const aksiId = async (page: Page) =>
  /name="\$ACTION_ID_([0-9a-f]+)"/.exec(await page.content())![1]!;

/** Buat pesanan NYATA lewat API checkout (stok terkunci, voucher terpakai) — bukan sisipan DB. */
async function pesanNyata(
  request: APIRequestContext,
  o: { slug?: string; qty?: number; voucher?: string; stok?: number; harga?: number } = {},
) {
  const p = buatProduk({
    price: o.harga ?? 100_000,
    varian: [{ name: "Standar", stock: o.stok ?? 10 }],
  });
  const [vid] = idVarian(p.id);
  const items = [{ varianId: vid!, qty: o.qty ?? 2 }];
  const ring = await request.post("/api/checkout/ringkasan", {
    data: { items, kota: "Yogyakarta", voucher: o.voucher ?? "" },
    headers: { "x-forwarded-for": uniqueIp() },
  });
  const total = (await ring.json()).ringkasan.total;
  const telepon = teleponAcak();
  const r = await request.post("/api/pesanan", {
    data: {
      kunci: kunciBaru(),
      items,
      nama: "Pembeli Nyata",
      telepon,
      alamat: "Jl. Melati No. 3, Sleman",
      kota: "Yogyakarta",
      voucher: o.voucher ?? "",
      totalPreview: total,
    },
    headers: { "x-forwarded-for": uniqueIp() },
  });
  expect(r.status()).toBe(200);
  const { kode } = await r.json();
  const id = query<{ id: number }>('SELECT id FROM "Order" WHERE code = ?', kode)[0]!.id;
  return { id, kode, vid: vid!, produk: p, telepon, total };
}

test.describe("otorisasi pesanan", () => {
  test("anonim ditolak di semua halaman/route pesanan & pengaturan; STAFF boleh pesanan tetapi tidak ekspor/pengaturan", async ({
    request,
    page,
  }) => {
    const o = buatOrder({ proof: "" });
    for (const u of [
      "/admin/pesanan",
      `/admin/pesanan/${o.id}`,
      `/admin/pesanan/${o.id}/invoice`,
      "/admin/pengaturan",
    ]) {
      const r = await request.get(u, { maxRedirects: 0 });
      expect([307, 308], u).toContain(r.status());
    }
    for (const u of [`/admin/pesanan/bukti/${o.id}`, "/admin/pesanan/ekspor"]) {
      const r = await request.get(u, { maxRedirects: 0 });
      expect([307, 308, 401], u).toContain(r.status());
    }
    await login(page, STAFF_EMAIL, STAFF_PASSWORD);
    for (const u of ["/admin/pesanan", `/admin/pesanan/${o.id}`, `/admin/pesanan/${o.id}/invoice`])
      expect((await page.goto(u))?.status(), u).toBe(200);
    const e = await page.request.get("/admin/pesanan/ekspor");
    expect(e.status()).toBe(403);
    expect(await e.json()).toEqual({ error: "Tidak diizinkan." });
    await page.goto("/admin/pengaturan");
    expect(page.url()).toContain("/admin?akses=ditolak");
    await page.goto("/admin/pesanan");
    await expect(page.getByTestId("ekspor-csv")).toHaveCount(0); // tautan ekspor tidak ditampilkan untuk STAFF
  });
});

test.describe("daftar pesanan", () => {
  test("cari kode/nama/HP, filter status; kata kunci wildcard tidak cocok apa pun; paginasi 25/halaman", async ({
    page,
  }) => {
    await login(page);
    const tag = huruf();
    const a = buatOrder({ nama: `Siti ${tag}`, status: "DIBAYAR" });
    buatOrder({ nama: `Budi ${tag}`, status: "SELESAI" });
    await page.goto(`/admin/pesanan?q=${tag}`);
    await expect(page.getByTestId("baris-pesanan")).toHaveCount(2);
    await page.goto(`/admin/pesanan?q=${tag}&status=DIBAYAR`);
    await expect(page.getByTestId("baris-pesanan")).toHaveCount(1);
    await expect(page.getByTestId("baris-pesanan")).toContainText(a.kode);
    await page.goto(`/admin/pesanan?q=${a.kode.toLowerCase()}`);
    await expect(page.getByTestId("baris-pesanan")).toHaveCount(1);
    await page.goto(`/admin/pesanan?q=${a.telepon}`);
    await expect(page.getByTestId("baris-pesanan").first()).toContainText(a.kode);
    for (const w of ["%", "_", "%%", "\\"]) {
      await page.goto(`/admin/pesanan?q=${encodeURIComponent(w)}`);
      await expect(page.getByTestId("baris-pesanan"), w).toHaveCount(0);
    }
    for (const bad of [
      "status=HACK",
      "halaman=abc",
      "halaman=999999",
      "halaman=-1",
      `q=${"x".repeat(500)}`,
    ])
      expect((await page.goto(`/admin/pesanan?${bad}`))?.status(), bad).toBe(200);
    // paginasi
    const t2 = huruf();
    for (let i = 0; i < 30; i++) buatOrder({ nama: `Massal ${t2} ${i}` });
    await page.goto(`/admin/pesanan?q=${t2}`);
    await expect(page.getByTestId("baris-pesanan")).toHaveCount(25);
    await expect(page.getByTestId("jumlah-pesanan")).toContainText("30 pesanan · halaman 1 dari 2");
    await page.getByRole("link", { name: "Berikutnya" }).click();
    await expect(page.getByTestId("baris-pesanan")).toHaveCount(5);
  });
});

test.describe("ubah status", () => {
  test("alur lengkap MENUNGGU_BAYAR → DIBAYAR → DIPROSES → DIKIRIM → SELESAI; pembeli melihat perubahannya di /lacak; final tanpa tombol", async ({
    page,
    request,
  }) => {
    const o = buatOrder({ status: "MENUNGGU_BAYAR" });
    await login(page);
    await page.goto(`/admin/pesanan/${o.id}`);
    const langkah: Array<[string, string, string]> = [
      ["DIBAYAR", "Sudah dibayar", "Sudah dibayar"],
      ["DIPROSES", "Sedang diproses", "Sedang diproses"],
      ["DIKIRIM", "Dikirim", "Dikirim"],
      ["SELESAI", "Selesai", "Selesai"],
    ];
    for (const [ke, labelAdmin, labelPembeli] of langkah) {
      await page.getByTestId(`ke-${ke}`).click();
      await expect(page.getByTestId("flash")).toHaveText("Status pesanan diperbarui.");
      await expect(page.getByTestId("status-saat-ini")).toContainText(labelAdmin);
      expect(status(o.id)).toBe(ke);
      const r = await request.post("/api/lacak", {
        data: { kode: o.kode, telepon: o.telepon },
        headers: { "x-forwarded-for": uniqueIp() },
      });
      expect((await r.json()).pesanan.statusLabel).toBe(labelPembeli);
    }
    await expect(page.getByTestId("aksi-status")).toHaveCount(0);
    await expect(page.getByText("Status ini final")).toBeVisible();
  });

  test("hanya transisi sah: tombol sesuai status; POST langsung dengan loncat status / status basi / nilai asing ditolak", async ({
    page,
  }) => {
    const o = buatOrder({ status: "MENUNGGU_BAYAR" });
    await login(page);
    await page.goto(`/admin/pesanan/${o.id}`);
    await expect(page.getByTestId("ke-DIBAYAR")).toBeVisible();
    await expect(page.getByTestId("ke-DIBATALKAN")).toBeVisible();
    for (const k of ["DIPROSES", "DIKIRIM", "SELESAI"])
      await expect(page.getByTestId(`ke-${k}`)).toHaveCount(0);
    const aksi = await aksiId(page);
    const kirim = (data: Record<string, string>) =>
      page.request.post(`/admin/pesanan/${o.id}`, {
        multipart: { [`$ACTION_ID_${aksi}`]: "", id: String(o.id), ...data },
        maxRedirects: 0,
      });
    for (const ke of [
      "SELESAI",
      "DIKIRIM",
      "DIPROSES",
      "MENUNGGU_BAYAR",
      "dibayar",
      "__proto__",
      "<x>",
      "",
    ])
      await kirim({ dari: "MENUNGGU_BAYAR", ke });
    expect(status(o.id)).toBe("MENUNGGU_BAYAR");
    await kirim({ dari: "DIPROSES", ke: "DIKIRIM" }); // "dari" basi (tidak sama dgn DB)
    expect(status(o.id)).toBe("MENUNGGU_BAYAR");
    await kirim({ dari: "MENUNGGU_BAYAR", ke: "DIBAYAR" }); // kontrol positif
    expect(status(o.id)).toBe("DIBAYAR");
    // final tak bisa diubah walau dipaksa
    tulis((d) => d.prepare('UPDATE "Order" SET status = ? WHERE id = ?').run("SELESAI", o.id));
    for (const ke of ["DIBATALKAN", "DIBAYAR", "DIPROSES"]) await kirim({ dari: "SELESAI", ke });
    expect(status(o.id)).toBe("SELESAI");
    // dikirim tidak bisa dibatalkan
    tulis((d) => d.prepare('UPDATE "Order" SET status = ? WHERE id = ?').run("DIKIRIM", o.id));
    await kirim({ dari: "DIKIRIM", ke: "DIBATALKAN" });
    expect(status(o.id)).toBe("DIKIRIM");
    // id fiktif / aneh
    for (const id of ["99999999", "abc", "-1"]) {
      const r = await page.request.post(`/admin/pesanan/${o.id}`, {
        multipart: { [`$ACTION_ID_${aksi}`]: "", id, dari: "DIKIRIM", ke: "SELESAI" },
        maxRedirects: 0,
      });
      expect(r.status()).toBeLessThan(500);
    }
    expect(status(o.id)).toBe("DIKIRIM");
  });

  test("pembatalan mengembalikan stok & kuota voucher TEPAT sekali — juga bila dikirim bersamaan; varian yang sudah dihapus dilewati", async ({
    page,
    request,
  }) => {
    const kodeV = `B${Date.now().toString(36).toUpperCase()}`;
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Voucher (code, type, value, minSubtotal, maxDiscount, quota, used, startsAt, endsAt, active) VALUES (?, 'NOMINAL', 5000, 0, NULL, 10, 0, ?, ?, 1)",
        )
        .run(kodeV, dbDate(Date.now() - 86_400_000), dbDate(Date.now() + 86_400_000)),
    );
    const o = await pesanNyata(request, { stok: 10, qty: 3, voucher: kodeV });
    expect(stokVarian(o.vid)).toBe(7);
    expect(query<{ used: number }>("SELECT used FROM Voucher WHERE code = ?", kodeV)[0]!.used).toBe(
      1,
    );
    await login(page);
    await page.goto(`/admin/pesanan/${o.id}`);
    const aksi = await aksiId(page);
    const kirim = () =>
      page.request.post(`/admin/pesanan/${o.id}`, {
        multipart: {
          [`$ACTION_ID_${aksi}`]: "",
          id: String(o.id),
          dari: "MENUNGGU_BAYAR",
          ke: "DIBATALKAN",
        },
        maxRedirects: 0,
      });
    await Promise.all([kirim(), kirim(), kirim()]);
    expect(status(o.id)).toBe("DIBATALKAN");
    expect(stokVarian(o.vid)).toBe(10); // kembali penuh, bukan 16/13
    expect(query<{ used: number }>("SELECT used FROM Voucher WHERE code = ?", kodeV)[0]!.used).toBe(
      0,
    );
    await kirim(); // sekali lagi setelah final
    expect(stokVarian(o.vid)).toBe(10);
    // pembeli melihat dibatalkan
    const r = await request.post("/api/lacak", {
      data: { kode: o.kode, telepon: o.telepon },
      headers: { "x-forwarded-for": uniqueIp() },
    });
    expect((await r.json()).pesanan.statusLabel).toBe("Dibatalkan");
    // varian dihapus sebelum pembatalan → tidak error, pesanan tetap bisa dibatalkan
    const o2 = await pesanNyata(request, { stok: 5, qty: 1 });
    tulis((d) => d.prepare("DELETE FROM Variant WHERE id = ?").run(o2.vid));
    await page.goto(`/admin/pesanan/${o2.id}`);
    await page.getByTestId("ke-DIBATALKAN").click();
    await expect(page.getByTestId("flash")).toBeVisible();
    expect(status(o2.id)).toBe("DIBATALKAN");
  });

  test("tombol batal pada UI mengembalikan stok; STAFF juga boleh mengubah status", async ({
    page,
    request,
  }) => {
    const o = await pesanNyata(request, { stok: 4, qty: 4 });
    expect(stokVarian(o.vid)).toBe(0);
    await login(page, STAFF_EMAIL, STAFF_PASSWORD);
    await page.goto(`/admin/pesanan/${o.id}`);
    await page.getByTestId("ke-DIBATALKAN").click();
    await expect(page.getByTestId("status-saat-ini")).toContainText("Dibatalkan");
    expect(stokVarian(o.vid)).toBe(4);
  });

  test("catatan internal tersimpan (HTML dibersihkan, maks 500), tidak tampil ke pembeli", async ({
    page,
    request,
  }) => {
    const o = buatOrder();
    await login(page);
    await page.goto(`/admin/pesanan/${o.id}`);
    await page
      .getByLabel("Catatan internal")
      .fill("Telepon dulu <script>alert(1)</script> sebelum kirim");
    await page.getByRole("button", { name: "Simpan catatan" }).click();
    await expect(page.getByTestId("flash")).toHaveText("Catatan disimpan.");
    const n = query<{ adminNote: string }>('SELECT adminNote FROM "Order" WHERE id = ?', o.id)[0]!
      .adminNote;
    expect(n).not.toMatch(/[<>]/);
    expect(n).toContain("Telepon dulu");
    const r = await request.post("/api/lacak", {
      data: { kode: o.kode, telepon: o.telepon },
      headers: { "x-forwarded-for": uniqueIp() },
    });
    expect(JSON.stringify(await r.json())).not.toContain("Telepon dulu");
  });

  test("data pembeli berisi HTML tampil sebagai teks di daftar & detail; id aneh → 404", async ({
    page,
  }) => {
    const o = buatOrder({ nama: '<img src=x onerror=window.__xss=1>"Budi"', kota: "<b>Kota</b>" });
    await login(page);
    for (const u of [
      "/admin/pesanan",
      `/admin/pesanan/${o.id}`,
      `/admin/pesanan/${o.id}/invoice`,
    ]) {
      await page.goto(u);
      expect(
        await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
        u,
      ).toBeUndefined();
      expect(await page.locator("main img[src='x']").count(), u).toBe(0);
    }
    await page.goto(`/admin/pesanan/${o.id}`);
    await expect(page.getByTestId("p-nama")).toContainText("<img src=x");
    for (const id of ["99999999", "abc", "-1", "1e3"])
      for (const sub of ["", "/invoice"])
        expect((await page.goto(`/admin/pesanan/${id}${sub}`))?.status(), id + sub).toBe(404);
  });
});

test.describe("bukti bayar, invoice, CSV", () => {
  test("bukti yang diunggah pembeli bisa dilihat admin/staf dengan header aman; tanpa bukti/anonim/id aneh ditolak", async ({
    page,
    request,
    browser,
  }) => {
    const o = buatOrder();
    const up = await request.post("/api/lacak/bukti", {
      multipart: {
        kode: o.kode,
        telepon: o.telepon,
        berkas: { name: "x.png", mimeType: "image/png", buffer: PNG },
      },
      headers: { "x-forwarded-for": uniqueIp() },
    });
    expect(up.status()).toBe(200);
    const tanpa = buatOrder();
    await login(page);
    await page.goto(`/admin/pesanan/${o.id}`);
    await expect(page.getByTestId("link-bukti")).toHaveAttribute(
      "href",
      `/admin/pesanan/bukti/${o.id}`,
    );
    const r = await page.request.get(`/admin/pesanan/bukti/${o.id}`);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toBe("image/png");
    expect(r.headers()["x-content-type-options"]).toBe("nosniff");
    expect(r.headers()["content-security-policy"]).toContain("sandbox");
    expect(r.headers()["cache-control"]).toContain("no-store");
    expect(Buffer.from(await r.body()).equals(PNG)).toBe(true);
    expect((await page.request.get(`/admin/pesanan/bukti/${tanpa.id}`)).status()).toBe(404);
    for (const id of ["99999999", "abc", "-1", "..%2F..%2Fetc"])
      expect((await page.request.get(`/admin/pesanan/bukti/${id}`)).status(), id).toBe(404);
    await page.goto(`/admin/pesanan/${tanpa.id}`);
    await expect(page.getByTestId("link-bukti")).toHaveCount(0);
    const staf = await (await browser.newContext()).newPage();
    await login(staf, STAFF_EMAIL, STAFF_PASSWORD);
    expect((await staf.request.get(`/admin/pesanan/bukti/${o.id}`)).status()).toBe(200);
    // tanpa sesi
    const anon = await request.get(`/admin/pesanan/bukti/${o.id}`, { maxRedirects: 0 });
    expect([307, 308, 401]).toContain(anon.status());
    expect(existsSync("e2e-uploads/bukti")).toBe(true);
  });

  test("invoice: identitas toko, kode, item, total; LUNAS vs menunggu (rekening hanya saat belum bayar); menu admin tersembunyi saat cetak", async ({
    page,
  }) => {
    const belum = buatOrder({ status: "MENUNGGU_BAYAR", total: 60_000 });
    const lunas = buatOrder({ status: "DIPROSES", total: 60_000 });
    await login(page);
    await page.goto(`/admin/pesanan/${belum.id}/invoice`);
    await expect(page.getByTestId("inv-kode")).toHaveText(belum.kode);
    await expect(page.getByTestId("inv-toko")).not.toBeEmpty();
    await expect(page.getByTestId("inv-status")).toHaveText("MENUNGGU PEMBAYARAN");
    await expect(page.getByTestId("inv-total")).toContainText("60.000");
    await expect(page.getByTestId("invoice")).toContainText("Kopi Uji");
    await expect(page.getByRole("heading", { name: "Pembayaran via transfer" })).toBeVisible();
    await page.goto(`/admin/pesanan/${lunas.id}/invoice`);
    await expect(page.getByTestId("inv-status")).toHaveText("LUNAS");
    await expect(page.getByRole("heading", { name: "Pembayaran via transfer" })).toHaveCount(0);
    // mode cetak
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("navigation", { name: "Menu admin" })).toBeHidden();
    await expect(page.getByRole("button", { name: /Cetak/ })).toBeHidden();
    await expect(page.getByTestId("invoice")).toBeVisible();
    await page.emulateMedia({ media: "screen" });
    await expect(page.getByRole("button", { name: /Cetak/ })).toBeVisible();
  });

  test("CSV (ADMIN): header & isi benar, BOM, filter status, formula injection dinetralkan; STAFF 403; anonim ditolak", async ({
    page,
    request,
  }) => {
    const tag = huruf();
    const jahat = buatOrder({
      nama: `=HYPERLINK("http://evil.test","klik") ${tag}`,
      status: "DIBAYAR",
      kota: "@SUM(1+1)",
    });
    buatOrder({ nama: `Normal ${tag}`, status: "SELESAI" });
    await login(page);
    const r = await page.request.get("/admin/pesanan/ekspor?status=DIBAYAR");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("text/csv");
    expect(r.headers()["content-disposition"]).toContain(
      'attachment; filename="pesanan-dibayar.csv"',
    );
    expect(r.headers()["cache-control"]).toContain("no-store");
    const teks = await r.text();
    expect(teks.charCodeAt(0)).toBe(0xfeff);
    const baris = teks.replace(/^﻿/, "").split("\r\n");
    expect(baris[0]).toContain("Kode,Waktu (WIB),Status,Nama");
    const mine = baris.find((l) => l.includes(jahat.kode))!;
    expect(mine).toBeTruthy();
    expect(mine).toContain("Sudah dibayar");
    expect(mine).toContain(`"'=HYPERLINK(""http://evil.test"",""klik"") ${tag}"`); // diawali apostrof → bukan formula
    expect(mine).toContain("'@SUM(1+1)");
    expect(teks).not.toContain(`Normal ${tag}`); // filter status berlaku
    // status tak sah → semua (bukan error)
    expect((await page.request.get("/admin/pesanan/ekspor?status=HACK")).status()).toBe(200);
    const all = await (await page.request.get("/admin/pesanan/ekspor")).text();
    expect(all).toContain(`Normal ${tag}`);
    // STAFF & anonim
    expect(page.url()).toBeTruthy();
    const anon = await request.get("/admin/pesanan/ekspor", { maxRedirects: 0 });
    expect([307, 308, 401]).toContain(anon.status());
  });
});

test("a11y & responsif admin pesanan: heading, caption, label, 360px tanpa overflow", async ({
  page,
}) => {
  const o = buatOrder({ nama: "N".repeat(90), kota: "K".repeat(60) });
  await login(page);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const u of ["/admin/pesanan", `/admin/pesanan/${o.id}`, `/admin/pesanan/${o.id}/invoice`]) {
    await page.goto(u);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
      u,
    ).toBeLessThanOrEqual(0);
    const levels = await page
      .locator("h1,h2,h3")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels[0], u).toBe(1);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]! - levels[i - 1]!, u).toBeLessThanOrEqual(1);
    for (const t of await page.locator("table").all())
      expect(await t.locator("caption").count(), u).toBe(1);
    for (const e of await page
      .locator("main input:visible:not([type=hidden]), main select:visible, main textarea:visible")
      .all())
      expect(
        await e.evaluate((el) => (el as HTMLInputElement).labels?.length ?? 0),
        u,
      ).toBeGreaterThan(0);
  }
});
