import { expect, test } from "@playwright/test";
import {
  buatOrder,
  buatProduk,
  idVarian,
  login,
  query,
  tulis,
  STAFF_EMAIL,
  STAFF_PASSWORD,
} from "./helpers";

/** Jalan di project terpisah ("dasbor", setelah semua tes yang membuat/mengubah pesanan) → angka global stabil. */
const angka = (t: string) => Number(t.replace(/[^\d]/g, ""));

test.describe("dasbor", () => {
  test("angka dasbor = hitungan dari DB (pesanan hari ini WIB, omzet hanya dari yang dibayar & tidak batal, menunggu bayar, stok)", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin");
    const baca = async (id: string) => (await page.getByTestId(`nilai-${id}`).textContent())!;
    const awal = {
      hariIni: angka(await baca("pesanan-hari-ini")),
      omzet: angka(await baca("omzet-hari-ini")),
      menunggu: angka(await baca("menunggu-bayar")),
      diproses: angka(await baca("perlu-diproses")),
      menipis: angka(await baca("stok-menipis")),
      habis: angka(await baca("stok-habis")),
    };
    // tambah: 2 menunggu bayar (tak masuk omzet), 1 dibayar 100.000, 1 selesai 50.000, 1 dibatalkan 999.000 (tak masuk omzet)
    buatOrder({ status: "MENUNGGU_BAYAR", total: 70_000 });
    buatOrder({ status: "MENUNGGU_BAYAR", total: 80_000 });
    buatOrder({ status: "DIBAYAR", total: 100_000 });
    buatOrder({ status: "SELESAI", total: 50_000 });
    buatOrder({ status: "DIBATALKAN", total: 999_000 });
    // pesanan LAMA (kemarin WIB) tidak masuk "hari ini" tetapi tetap dihitung di menunggu bayar
    const lama = buatOrder({ status: "DIBAYAR", total: 1_000_000 });
    tulis((d) =>
      d
        .prepare('UPDATE "Order" SET createdAt = ? WHERE id = ?')
        .run(new Date(Date.now() - 2 * 86_400_000).toISOString().replace("Z", "+00:00"), lama.id),
    );
    // stok: 1 menipis (3), 1 habis (0), 1 aman (50), 1 menipis tapi produk nonaktif (tak dihitung)
    buatProduk({ varian: [{ name: "a", stock: 3 }] });
    buatProduk({ varian: [{ name: "b", stock: 0 }] });
    buatProduk({ varian: [{ name: "c", stock: 50 }] });
    buatProduk({ active: false, varian: [{ name: "d", stock: 2 }] });
    await page.reload();
    expect(angka(await baca("pesanan-hari-ini"))).toBe(awal.hariIni + 5);
    expect(angka(await baca("omzet-hari-ini"))).toBe(awal.omzet + 150_000);
    expect(angka(await baca("menunggu-bayar"))).toBe(awal.menunggu + 2);
    expect(angka(await baca("perlu-diproses"))).toBe(awal.diproses + 2); // DIBAYAR hari ini + DIBAYAR lama
    expect(angka(await baca("stok-menipis"))).toBe(awal.menipis + 1);
    expect(angka(await baca("stok-habis"))).toBe(awal.habis + 1);
    // pesanan terbaru: 5 baris, urut terbaru
    await expect(page.getByTestId("tabel-terbaru").locator("tbody tr")).toHaveCount(5);
  });

  test("batas hari WIB: pesanan pukul 00:30 WIB hari ini dihitung; 23:30 WIB kemarin tidak", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin");
    const sebelum = angka((await page.getByTestId("nilai-pesanan-hari-ini").textContent())!);
    const wibSekarang = new Date(Date.now() + 7 * 3_600_000);
    const awalHariUtc =
      Date.UTC(wibSekarang.getUTCFullYear(), wibSekarang.getUTCMonth(), wibSekarang.getUTCDate()) -
      7 * 3_600_000; // 00:00 WIB hari ini
    const iso = (ms: number) => new Date(ms).toISOString().replace("Z", "+00:00");
    const a = buatOrder({ status: "MENUNGGU_BAYAR" });
    const b = buatOrder({ status: "MENUNGGU_BAYAR" });
    tulis((d) => {
      d.prepare('UPDATE "Order" SET createdAt = ? WHERE id = ?').run(iso(awalHariUtc + 1000), a.id); // 00:00:01 WIB hari ini
      d.prepare('UPDATE "Order" SET createdAt = ? WHERE id = ?').run(iso(awalHariUtc - 1000), b.id); // 23:59:59 WIB kemarin
    });
    await page.reload();
    expect(angka((await page.getByTestId("nilai-pesanan-hari-ini").textContent())!)).toBe(
      sebelum + 1,
    );
  });

  test("STAFF melihat dasbor; API ringkasan butuh sesi; tanpa data sensitif (hash/HP/alamat)", async ({
    page,
    request,
  }) => {
    expect((await request.get("/api/admin/ringkasan")).status()).toBe(401);
    await login(page, STAFF_EMAIL, STAFF_PASSWORD);
    const r = await page.request.get("/api/admin/ringkasan");
    expect(r.status()).toBe(200);
    expect(r.headers()["cache-control"]).toBe("no-store");
    const t = JSON.stringify(await r.json());
    for (const rahasia of ["passwordHash", "customerPhone", "address", "rahasia@contoh.test", "$2"])
      expect(t).not.toContain(rahasia);
    void query;
    void idVarian;
  });
});
